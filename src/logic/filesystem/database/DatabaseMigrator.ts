import { Database } from "better-sqlite3";

export default interface DatabaseMigrator {
    /**
     * Upgrade the given DatabaseManager's db schema version.
     *
     * @param database The Database that should be upgraded to a newer database schema version.
     */
    upgrade(database: Database): void;
}
