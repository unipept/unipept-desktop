import Database, { Database as DbType } from "better-sqlite3";
import async, { AsyncQueue } from "async";

export default class DatabaseManager {
    // Reading and writing large assays to and from the database can easily take longer than 5 seconds, causing
    // a "SQLBusyException" to b§e thrown. By increasing the timeout to a value, larger than the time it should take
    // to execute these transactions, these errors can be avoided.
    public static readonly DB_TIMEOUT: number = 15000;

    private readonly db: DbType;
    private readonly queue: AsyncQueue<any>;
    // Version of the application that was last used with this database.
    private dbApplicationVersion: string;

    // Database schema version that the db is currently on.
    public readonly schemaVersion: number;

    constructor(
        private readonly dbLocation: string
    ) {
        this.db = new Database(this.dbLocation, {
            timeout: DatabaseManager.DB_TIMEOUT
        });

        this.schemaVersion = this.db.pragma("user_version");
        try {
            const result = this.db.prepare(
                "SELECT application_version FROM database_metadata"
            ).get();

            if (result) {
                this.dbApplicationVersion = result.application_version;
            } else {
                this.dbApplicationVersion = "0.0.0";
            }
        } catch (err) {
            this.dbApplicationVersion = "0.0.0";
        }

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
}
