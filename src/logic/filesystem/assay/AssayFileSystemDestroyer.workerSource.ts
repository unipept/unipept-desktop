import Database from "better-sqlite3";

export async function compute([assayId, dbFile, installationDir]: [string, string, string]): Promise<void> {
    //@ts-ignore
    const db = new Database(dbFile, {}, installationDir);
    db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM storage_metadata WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM assays WHERE `id` = ?").run(assayId);
    db.close();
}
