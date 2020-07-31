import { expose } from "threads/worker";
import Database from "better-sqlite3";

expose(removeAssayFromDB)

async function removeAssayFromDB(assayId: number, dbFile: string, installationDir: string): Promise<void> {
    //@ts-ignore
    const db = new Database(dbFile, {}, installationDir);
    db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM storage_metadata WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM assays WHERE `id` = ?").run(assayId);
    db.close();
}
