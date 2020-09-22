import { expose, TransferDescriptor } from "threads/dist";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import Database from "better-sqlite3";
import { Transfer } from "threads/worker";

expose({ readPept2Data, writePept2Data })

export function readPept2Data(
    installationDir: string,
    dbFile: string,
    assayId: string
): [TransferDescriptor, TransferDescriptor, PeptideTrust] | null {
    // @ts-ignore
    const db = new Database(dbFile, { timeout: 15000, verbose: console.warn }, installationDir);

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

    return [Transfer(indexBuffer), Transfer(dataBuffer), peptideTrust]
}

export function writePept2Data(
    installationDir: string,
    peptDataIndexBuffer: SharedArrayBuffer,
    peptDataDataBuffer: SharedArrayBuffer,
    peptideTrust: PeptideTrust,
    assayId: string,
    dbFile: string
) {
    //@ts-ignore
    const db = new Database(dbFile, { timeout: 15000, verbose: console.warn }, installationDir);

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
