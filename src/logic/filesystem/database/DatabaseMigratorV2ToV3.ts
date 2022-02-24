import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import Database from "better-sqlite3";
import v2_to_v3 from "raw-loader!@/db/migrations/v2_to_v3.sql";
import crypto from "crypto";
import path from "path";
import fs from "fs";

export default class DatabaseMigratorV2ToV3 implements DatabaseMigrator {
    constructor(private readonly projectLocation: string) {}

    public upgrade(database: Database.Database): void {
        // Read in all data and metadata for all assays.
        const assayData = database.prepare(
            "SELECT * FROM assays INNER JOIN storage_metadata ON assays.id = storage_metadata.assay_id"
        ).all();

        // Store all of this information temporarily in-memory
        const assays: any[] = [];
        for (const row of assayData) {
            // We keep track of all the information that's associated with a single assay
            const searchConfig = database.prepare(
                "SELECT * FROM search_configuration WHERE id = ?"
            ).get(row.configuration_id);

            const peptideTrust = database.prepare(
                "SELECT * FROM peptide_trust WHERE assay_id = ?"
            ).get(row.assay_id);

            assays.push({
                assayId: row.id,
                assayName: row.name,
                studyId: row.study_id,
                equateIl: searchConfig.equate_il,
                filterDuplicates: searchConfig.filter_duplicates,
                missedCleavages: searchConfig.missing_cleavage_handling,
                missedPeptides: peptideTrust.missed_peptides,
                matchedPeptides: peptideTrust.matched_peptides,
                searchedPeptides: peptideTrust.searched_peptides,
                endpoint: row.endpoint,
                date: row.analysis_date,
                dbVersion: row.db_version
            });
        }

        console.log(JSON.stringify(assays));

        const studyData = database.prepare(
            "SELECT * FROM studies"
        ).all();

        const studies: any[] = [];
        for (const row of studyData) {
            studies.push({
                id: row.id,
                name: row.name
            })
        }

        // Now, drop the table and create a new one with a different column name
        database.exec(v2_to_v3);

        // Write all of the studies to the database
        for (const studyRow of studies) {
            database.prepare(`
                INSERT INTO studies (id, name)
                VALUES (?, ?)
            `).run(studyRow.id, studyRow.name)
        }

        // Write all of the information that was temporarily kept in-memory back to the database
        for (const row of assays) {
            // First insert the search configuration
            const searchConfigId = database.prepare(`
                INSERT INTO search_configuration (equate_il, filter_duplicates, missing_cleavage_handling)
                VALUES (?, ?, ?)
            `).run(row.equateIl, row.filterDuplicates, row.missedCleavages).lastInsertRowid;

            // Then insert assay
            database.prepare(`
                INSERT INTO assays (id, name, study_id, configuration_id, endpoint)
                VALUES (?, ?, ?, ?, ?)
            `).run(row.assayId, row.assayName, row.studyId, searchConfigId, row.endpoint);

            database.prepare(`
                INSERT INTO peptide_trust
                VALUES (?, ?, ?, ?)
            `).run(row.assayId, row.missedPeptides, row.matchedPeptides, row.searchedPeptides);

            // Data should be recomputed for this upgrade, which is why the fingerprint is set to an empty string here.
            const fingerPrint: string = "";
            const dataHash: string = this.computeDataHash(row.assayId);

            database.prepare(`
                INSERT INTO storage_metadata
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(row.assayId, searchConfigId, row.endpoint, fingerPrint, dataHash, row.date);
        }
    }

    private computeDataHash(assayId: string): string {
        const dataHash = crypto.createHash("sha256");
        const bufferPath: string = path.join(this.projectLocation, ".buffers");
        const dataBufferPath = path.join(bufferPath, assayId + ".data");
        const indexBufferPath = path.join(bufferPath, assayId + ".index");

        const dataBuffer = fs.readFileSync(dataBufferPath);
        dataHash.update(dataBuffer);

        const dataHex = dataHash.digest("hex");

        const indexHash = crypto.createHash("sha256");

        const indexBuffer = fs.readFileSync(indexBufferPath);
        indexHash.update(indexBuffer);

        const indexHex = indexHash.digest("hex");

        return dataHex + indexHex;
    }
}
