import { Database } from "better-sqlite3";

export default interface DatabaseMigrator {
    /**
     * Upgrade the given DatabaseManager's db schema version.
     *
     * @param database The Database that should be upgraded to a newer database schema version.
     * @param currentAppVersion The current version of the application that is going to use this database.
     */
    upgrade(database: Database, currentAppVersion: string): Promise<void>;
}
