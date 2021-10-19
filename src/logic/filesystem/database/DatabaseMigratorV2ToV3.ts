import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import Database from "better-sqlite3";
import v2_to_v3 from "raw-loader!@/db/migrations/v2_to_v3.sql";
import { ProteomicsAssay } from "unipept-web-components";
import CachedResultsManager from "@/logic/filesystem/assay/processed/CachedResultsManager";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

export default class DatabaseMigratorV2ToV3 implements DatabaseMigrator {
    constructor(private readonly projectLocation: string) {}

    public upgrade(database: Database.Database): void {
        // TODO implement and make sure that this works
        // // Also read in all the assay data
        // const assayData = database.prepare("SELECT * FROM assays").all();
        //
        // const assays = new Map<number, ProteomicsAssay>();
        // for (const row of assayData) {
        //     const assay = new ProteomicsAssay(row.id);
        //     assays.set(row.id, assay);
        // }
        //
        // // Read in the metadata for all assays (this is required to copy the data to a new table later on)
        // const metadata = database.prepare("SELECT * FROM storage_metadata").all();
        //
        // // Now, drop the table and create a new one with a different column name
        // database.exec(v2_to_v3);
        //
        // // const cachedResultsManager = new CachedResultsManager();
        //
        // // Write all the metadata to the database again.
        // for (const row of metadata) {
        //     database.prepare(`
        //         INSERT INTO storage_metadata
        //         VALUES (?, ?, ?, ?, ?, ?)
        //     `).run(row.assay_id, row.configuration_id, row.endpoint);
        // }

    }
}

class SimpleDatabaseManager extends DatabaseManager {
    public async performQuery<ResultType>(query: (db: Database.Database) => ResultType): Promise<ResultType> {
        return super.performQuery(query);
    }
}
