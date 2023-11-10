import DatabaseMigrator from "@main/database/migrators/DatabaseMigrator";
import { Database } from "better-sqlite3";
// @ts-ignore (raw sql file detection not working in Intellij)
import v0_to_v1 from "@main/database/migrations/v0_to_v1.sql?raw";

/**
 * This migrator updates the current database from schema version 0 to version 1.
 *
 * Changes between these schema versions:
 * - Added new table "database_metadata", which keeps track of the current application version.
 */
export default class DatabaseMigratorV0ToV1 implements DatabaseMigrator {
    public async upgrade(database: Database, currentAppVersion: string): Promise<void> {
        database.exec(v0_to_v1);
        database.prepare("DELETE FROM database_metadata").run();
        database.prepare("INSERT INTO database_metadata (application_version) VALUES (?)").run(
            currentAppVersion
        );
    }
}
