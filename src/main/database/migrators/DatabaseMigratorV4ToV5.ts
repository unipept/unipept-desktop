import Database from "better-sqlite3";
import DatabaseMigrator from "@main/database/migrators/DatabaseMigrator";
// @ts-ignore (raw sql file detection not working in Intellij)
import v4_to_v5 from "@main/database/migrations/v4_to_v5.sql?raw";

/**
 * This migrator updates and existing database from version 4 to version 5. The most important change between these two
 * versions of the application / database is that the most recent version keeps track of the custom database details
 * that were used for the analysis of a specific sample. These details are required by the application to check if the
 * selected custom database is available for analysis (or not).
 *
 * @author Pieter Verschaffelt
 */
export default class DatabaseMigratorV4ToV5 implements DatabaseMigrator {
    public async upgrade(database: Database.Database): Promise<void> {
        // Now also migrate the SQL-database itself. For this to work, we need to read in all data and metadata for the
        // assays and convert to the newest database format. These data and metadata files will be temporarily kept
        // in memory.

        // We know that the database format still follows schema_v4 at this point.
        const assayData = database.prepare(
            "SELECT * FROM assays"
        ).all() as AssayTableRowV4[] ;

        const storageMetadata = database.prepare(
            "SELECT * FROM storage_metadata"
        ).all() as StorageMetadataTableRowV4[];

        // Now, change the schema of the database itself
        database.exec(v4_to_v5);

        // Insert the old data in the newest database schema again.
        for (const assay of assayData) {
            // First we create the new AnalysisSources in the database.

            // Since this schema version (v5) is the first schema that's used since the application supports custom
            // databases, we cannot encounter a custom database during this migration and should thus also not
            // care about it here.
            const runResult = database.prepare(`
                INSERT INTO analysis_source (type, endpoint, uniprot_version, swissprot_selected, trembl_selected)
                VALUES (?, ?, ?, ?, ?)
            `).run("online", assay.endpoint, "N/A", 1, 1);

            database.prepare(`
                INSERT INTO assays (id, name, study_id, configuration_id, analysis_source_id)
                VALUES (?, ?, ?, ?, ?)
            `).run(assay.id, assay.name, assay.study_id, assay.configuration_id, runResult.lastInsertRowid);
        }

        for (const storage of storageMetadata) {
            const runResult = database.prepare(`
                INSERT INTO analysis_source(type, endpoint, uniprot_version, swissprot_selected, trembl_selected)
                VALUES (?, ?, ?, ?, ?)
            `).run("online", storage.endpoint, "N/A", 1, 1);

            database.prepare(`
                INSERT INTO storage_metadata (assay_id, configuration_id, data_hash, analysis_date, analysis_source_id)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                storage.assay_id,
                storage.configuration_id,
                storage.data_hash,
                storage.analysis_date,
                runResult.lastInsertRowid
            );
        }
    }
}

type AssayTableRowV4 = {
    id: string,
    name: string,
    study_id: string,
    configuration_id: number,
    endpoint: string
};

type StorageMetadataTableRowV4 = {
    assay_id: string,
    configuration_id: number,
    endpoint: string,
    fingerprint: string,
    data_hash: string,
    analysis_date: string
};
