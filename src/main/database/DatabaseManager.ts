import Database, { Database as DbType } from "better-sqlite3";
import async, { QueueObject } from "async";
import path from "path";
import DatabaseMigrator from "@main/database/migrators/DatabaseMigrator";
import DatabaseMigratorV0ToV1 from "@main/database/migrators/DatabaseMigratorV0ToV1";
import DatabaseMigratorV1ToV2 from "@main/database/migrators/DatabaseMigratorV1ToV2";
import DatabaseMigratorV2ToV3 from "@main/database/migrators/DatabaseMigratorV2ToV3";
import DatabaseMigratorV3ToV4 from "@main/database/migrators/DatabaseMigratorV3ToV4";
import DatabaseMigratorV4ToV5 from "@main/database/migrators/DatabaseMigratorV4ToV5";
import DatabaseMigratorV5ToV6 from "@main/database/migrators/DatabaseMigratorV5ToV6";
import Schema, { DatabaseMetadataTableRow } from "@main/database/schemas/Schema";

export default class DatabaseManager {
    // Reading and writing large assays to and from the database can easily take longer than 5 seconds, causing
    // a "SQLBusyException" to be thrown. By increasing the timeout to a value larger than the time it should take
    // to execute these transactions, these errors can be avoided.
    public static readonly DB_TIMEOUT: number = 15000;

    private db!: DbType;
    private queue!: QueueObject<any>;
    // Version of the application that was last used with this database.
    private dbApplicationVersion!: string;

    // Database schema version that the db is currently on.
    public schemaVersion!: number;

    // Maps each schema index onto the db-migrator that can be used to update the db to the next schema version.
    private readonly migrations: (() => DatabaseMigrator)[] = [
        () => new DatabaseMigratorV0ToV1(),
        () => new DatabaseMigratorV1ToV2(path.dirname(this.dbLocation)),
        () => new DatabaseMigratorV2ToV3(path.dirname(this.dbLocation)),
        () => new DatabaseMigratorV3ToV4(path.dirname(this.dbLocation)),
        () => new DatabaseMigratorV4ToV5(),
        () => new DatabaseMigratorV5ToV6()
    ];

    /**
     * Make a new DatabaseManager. Please note that the async method `initializeDatabase` must also be called (after
     * constructing this DatabaseManager) before this manager can be used properly.
     *
     * @param dbLocation
     */
    constructor(
        private readonly dbLocation: string
    ) {}

    public async initializeDatabase(
        currentAppVersion: string
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

            this.db.prepare("INSERT INTO database_metadata (application_version) VALUES (?)").run(currentAppVersion);
        }

        this.schemaVersion = this.db.pragma("user_version", { simple: true }) as number;
        await this.checkAndUpgradeSchema(currentAppVersion);
        this.dbApplicationVersion = (this.db.prepare(
            "SELECT application_version FROM database_metadata"
        ).get() as DatabaseMetadataTableRow).application_version;

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
            this.queue.push(
                {
                    query
                },
                // @ts-ignore (async types are not correct)
                resolve
            );
        });
    }

    /**
     * Check if the current DB-schema is up-to-date and upgrade the schema if this is not the case.
     */
    private async checkAndUpgradeSchema(currentAppVersion: string): Promise<void> {
        for (let currentSchema: number = this.schemaVersion; currentSchema < Schema.LATEST_VERSION; currentSchema++) {
            await this.migrations[currentSchema]().upgrade(
                this.db,
                currentAppVersion
            );
            this.db.pragma("user_version = " + (currentSchema + 1));
        }
    }
}
