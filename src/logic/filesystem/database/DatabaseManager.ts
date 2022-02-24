import Database, { Database as DbType } from "better-sqlite3";
import async, { AsyncQueue } from "async";
import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import DatabaseMigratorV0ToV1 from "@/logic/filesystem/database/DatabaseMigratorV0ToV1";
import Schema from "@/logic/filesystem/database/Schema";
import DatabaseMigratorV1ToV2 from "@/logic/filesystem/database/DatabaseMigratorV1ToV2";

const electron = require("electron");
const app = electron.remote.app;

import path from "path";
import DatabaseMigratorV2ToV3 from "@/logic/filesystem/database/DatabaseMigratorV2ToV3";

export default class DatabaseManager {
    // Reading and writing large assays to and from the database can easily take longer than 5 seconds, causing
    // a "SQLBusyException" to be thrown. By increasing the timeout to a value larger than the time it should take
    // to execute these transactions, these errors can be avoided.
    public static readonly DB_TIMEOUT: number = 15000;

    private readonly db: DbType;
    private readonly queue: AsyncQueue<any>;
    // Version of the application that was last used with this database.
    private dbApplicationVersion: string;

    // Database schema version that the db is currently on.
    public readonly schemaVersion: number;

    // Maps each schema index onto the db-migrator that can be used to update the db to the next schema version.
    private readonly migrations: (() => DatabaseMigrator)[] = [
        () => new DatabaseMigratorV0ToV1(),
        () => new DatabaseMigratorV1ToV2(path.dirname(this.dbLocation)),
        () => new DatabaseMigratorV2ToV3(path.dirname(this.dbLocation))
    ];

    constructor(
        private readonly dbLocation: string
    ) {
        try {
            this.db = new Database(this.dbLocation, {
                timeout: DatabaseManager.DB_TIMEOUT,
                fileMustExist: true
            });
        } catch (err) {
            // DB does not exist
            this.db = new Database(this.dbLocation, {
                timeout: DatabaseManager.DB_TIMEOUT
            });

            this.db.exec(Schema.LATEST_SCHEMA);
            this.db.pragma("user_version = " + Schema.LATEST_VERSION);

            this.db.prepare("INSERT INTO database_metadata (application_version) VALUES (?)").run(app.getVersion());
        }

        this.schemaVersion = this.db.pragma("user_version", { simple: true });
        this.checkAndUpgradeSchema();
        this.dbApplicationVersion = this.db.prepare(
            "SELECT application_version FROM database_metadata"
        ).get().application_version;

        this.queue = async.queue((task, callback) => {
            callback(task.query(this.db));
        }, 1);
    }

    public getApplicationVersion(): string {
        return this.dbApplicationVersion;
    }

    public async setApplicationVersion(version: string): Promise<void> {
        await this.performQuery<void>((db: DbType) => {
            db.prepare("DELETE FROM database_metadata").run();
            db.prepare("INSERT INTO database_metadata (application_version) VALUES (?)").run(version);
        });
        this.dbApplicationVersion = version;
    }

    public async performQuery<ResultType>(query: (db: DbType) => ResultType): Promise<ResultType> {
        return new Promise<ResultType>((resolve) => {
            this.queue.push({
                query
            }, resolve);
        });
    }

    /**
     * Check if the current DB-schema is up-to-date and upgrade the schema if this is not the case.
     */
    private checkAndUpgradeSchema(): void {
        for (let currentSchema: number = this.schemaVersion; currentSchema < Schema.LATEST_VERSION; currentSchema++) {
            console.log(currentSchema);
            this.migrations[currentSchema]().upgrade(this.db);
            this.db.pragma("user_version = " + (currentSchema + 1));
        }
    }
}
