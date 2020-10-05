import Database, { Database as DbType } from "better-sqlite3";
import async, { AsyncQueue } from "async";

export default class DatabaseManager {
    // Reading and writing large assays to and from the database can easily take longer than 5 seconds, causing
    // a "SQLBusyException" to b§e thrown. By increasing the timeout to a value, larger than the time it should take
    // to execute these transactions, these errors can be avoided.
    public static readonly DB_TIMEOUT: number = 15000;

    private readonly db: DbType;
    private readonly queue: AsyncQueue<any>;

    constructor(
        private readonly dbLocation: string
    ) {
        this.db = new Database(this.dbLocation, {
            timeout: DatabaseManager.DB_TIMEOUT
        });

        this.queue = async.queue((task, callback) => {
            callback(task.query(this.db));
        }, 1);
    }

    public async performQuery<ResultType>(query: (db: DbType) => ResultType): Promise<ResultType> {
        return new Promise<ResultType>((resolve) => {
            this.queue.push({
                query
            }, resolve);
        });
    }
}
