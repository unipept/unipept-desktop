import Database from "better-sqlite3";
import DatabaseMigrator from "@main/database/migrators/DatabaseMigrator";
// @ts-ignore (raw sql file detection not working in Intellij)
import v5_to_v6 from "@main/database/migrations/v5_to_v6.sql?raw"

type AnalysisSourceRow = {
    id: number,
    type: "online" | "custom_db",
    endpoint: string,
    uniprot_version: string,
    selected_taxa: string,
    swissprot_selected: number,
    trembl_selected: number
}

export default class DatabaseMigratorV5ToV6 implements DatabaseMigrator {
    public async upgrade(database: Database.Database): Promise<void> {
        // First store all the information that's currently stored in the `analysis_source` table in memory.
        const analysisSourceData = database.prepare("SELECT * FROM analysis_source").all() as AnalysisSourceRow[];

        database.pragma("foreign_keys = OFF");
        // Then, update the schema of the database itself.
        database.exec(v5_to_v6);

        // Now, insert the old data in the newest database schema again.
        for (const analysisSource of analysisSourceData) {
            const sources: string[] = [];
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
