import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import { Database } from "better-sqlite3";
import v1_to_v2 from "raw-loader!@/db/migrations/v1_to_v2.sql";

export default class DatabaseMigratorV1ToV2 implements DatabaseMigrator {
    public upgrade(database: Database): void {
        database.exec(v1_to_v2);
        // Now we need to set the static database version that was used for all of the samples that were analysed
        // in the current project.
        const preparedStmt = database.prepare("UPDATE storage_metadata SET static_db_version = ?");
        // At a specific point in time, we were required to fix the static database version due to changes that were
        // made to the available taxon ranks. All projects before this migration did use this specific database version.
        // That's why 2020-06-01 is the default value in this case.
        preparedStmt.run("2020-06-01");
    }
}
