import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import Database from "better-sqlite3";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import v4_to_v5 from "raw-loader!@/db/migrations/v4_to_v5.sql";

/**
 * This migrator updates and existing database from version 4 to version 5. The most important change between these two
 * versions of the application / database is that the most recent version keeps track of the custom database details
 * that were used for the analysis of a specific sample. These details are required by the application to check if the
 * selected custom database is available for analysis (or not).
 *
 * The migrator will also reset the default configuration values of the application since important changes have been
 * made to these default values since the last version (the default Docker settings for Windows-systems have changed
 * for example).
 *
 * @author Pieter Verschaffelt
 */
export default class DatabaseMigratorV4ToV5 implements DatabaseMigrator {
    constructor(private readonly projectLocation: string) {}

    public async upgrade(database: Database.Database): Promise<void> {
        // Reset the configuration back to the default value.
        const configManager = new ConfigurationManager();
        const defaultConfig = configManager.getDefaultConfiguration();
        await configManager.writeConfiguration(defaultConfig);

        // Now also migrate the SQL-database itself. For this to work, we need to read in all data and metadata for the
        // assays and convert to the newest database format. These data and metadata files will be temporarily kept
        // in memory.

        // We know that the database format still follows schema_v4 at this point.
        const assayData: AssayTableRowV4[] = database.prepare(
            "SELECT * FROM assays"
        ).get();

        const storageMetadata: StorageMetadataTableRowV4[] = database.prepare(
            "SELECT * FROM storage_metadata"
        ).get();

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
                VALUES (?, ?, ?, ?)
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
