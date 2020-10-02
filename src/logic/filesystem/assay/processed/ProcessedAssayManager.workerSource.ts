import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import Database from "better-sqlite3";


export async function readPept2Data(
    [installationDir, dbFile, assayId]: [string, string, string]
): Promise<[ArrayBuffer, ArrayBuffer, PeptideTrust] | null> {
    // @ts-ignore
    const db = new Database(dbFile, { timeout: 15000 }, installationDir);

    const row = db.prepare("SELECT * FROM pept2data WHERE `assay_id` = ?").get(assayId);

    if (!row) {
        return null;
    }

    const indexBuffer = bufferToSharedArrayBuffer(row.index_buffer);
    const dataBuffer = bufferToSharedArrayBuffer(row.data_buffer);

    const trustRow = db.prepare("SELECT * FROM peptide_trust WHERE `assay_id` = ?").get(assayId);

    if (!trustRow) {
        return null;
    }

    const peptideTrust = new PeptideTrust(
        JSON.parse(trustRow.missed_peptides),
        trustRow.matched_peptides,
        trustRow.searched_peptides
    );

    return [indexBuffer, dataBuffer, peptideTrust]
}

export async function writePept2Data(
    [
        installationDir,
        peptDataIndexBuffer,
        peptDataDataBuffer,
        peptideTrust,
        assayId,
        dbFile
    ]: [string, ArrayBuffer, ArrayBuffer, PeptideTrust, string, string]
) {
    //@ts-ignore
    const db = new Database(dbFile, { timeout: 15000 }, installationDir);

    // First delete all existing rows for this assay;
    db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);

    db.prepare("INSERT INTO pept2data VALUES (?, ?, ?)").run(
        assayId,
        arrayBufferToBuffer(peptDataIndexBuffer),
        arrayBufferToBuffer(peptDataDataBuffer)
    );

    const insertTrust = db.prepare("INSERT INTO peptide_trust VALUES (?, ?, ?, ?)");
    insertTrust.run(
        assayId,
        JSON.stringify(peptideTrust.missedPeptides),
        peptideTrust.matchedPeptides,
        peptideTrust.searchedPeptides
    );
}

function arrayBufferToBuffer(buffer: ArrayBuffer): Buffer {
    return new Buffer(buffer);
}

function bufferToSharedArrayBuffer(buf: Buffer): SharedArrayBuffer {
    const ab = new SharedArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
