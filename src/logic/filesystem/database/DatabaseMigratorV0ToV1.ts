import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import { Database } from "better-sqlite3";
import v0_to_v1 from "raw-loader!@/db/migrations/v0_to_v1.sql";

const { app } = require("@electron/remote");

/**
 * This migrator updates the current database from schema version 0 to version 1.
 *
 * Changes between these schema versions:
 * - Added new table "database_metadata", which keeps track of the current application version.
 */
export default class DatabaseMigratorV0ToV1 implements DatabaseMigrator {
    public async upgrade(database: Database): Promise<void> {
        database.exec(v0_to_v1);
        database.prepare("DELETE FROM database_metadata").run();
        database.prepare("INSERT INTO database_metadata (application_version) VALUES (?)").run(app.getVersion());
    }
}
