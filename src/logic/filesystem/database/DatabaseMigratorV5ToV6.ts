import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import Database from "better-sqlite3";
import v5_to_v6 from "raw-loader!@/db/migrations/v5_to_v6.sql";

export default class DatabaseMigratorV5ToV6 implements DatabaseMigrator {
    constructor(private readonly projectLocation: string) {}

    public async upgrade(database: Database.Database): Promise<void> {
        // First store all the information that's currently stored in the `analysis_source` table in memory.
        const analysisSourceData = database.prepare("SELECT * FROM analysis_source").all();

        database.pragma("foreign_keys = OFF");
        // Then, update the schema of the database itself.
        database.exec(v5_to_v6);

        // Now, insert the old data in the newest database schema again.
        for (const analysisSource of analysisSourceData) {
            const sources = [];
            if (analysisSource.swissprot_selected) {
                sources.push("swissprot");
            }

            if (analysisSource.trembl_selected) {
                sources.push("trembl");
            }

            database.prepare(`
                INSERT INTO analysis_source (id, type, endpoint, uniprot_version, selected_taxa, sources)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(analysisSource.id, analysisSource.type, analysisSource.endpoint, analysisSource.uniprot_version, analysisSource.selected_taxa, sources.join(","));
        }

        database.pragma("foreign_keys = ON");
    }
}
