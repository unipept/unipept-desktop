import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import { expose } from "threads";
import Database from "better-sqlite3";
import { Transfer } from "threads/worker";
import { TransferDescriptor } from "threads/dist";
import { Observable } from "threads/observable";
import { ShareableMap } from "shared-memory-datastructures";
import PeptideData from "unipept-web-components/src/business/communication/peptides/PeptideData";
import PeptideDataSerializer from "unipept-web-components/src/business/communication/peptides/PeptideDataSerializer";

expose({ readPept2Data, writePept2Data });

export type ReadResult = {
    type: "progress",
    value: number
} | {
    type: "result",
    value: [TransferDescriptor, TransferDescriptor, PeptideTrust]
};

export function readPept2Data(installationDir: string, dbFile: string, assayId: string): [TransferDescriptor, TransferDescriptor, PeptideTrust] {
    // @ts-ignore
    const db = new Database(dbFile, { timeout: 15000 }, installationDir);
    db.pragma("journal_mode = WAL");

    const start1 = new Date().getTime();
    const row = db.prepare("SELECT * FROM pept2data WHERE `assay_id` = ?").get(assayId);
    const indexBuffer = bufferToSharedArrayBuffer(row.index_buffer);
    const dataBuffer = bufferToSharedArrayBuffer(row.data_buffer);

    const end1 = new Date().getTime();
    console.log("Reading from db: " + (end1 - start1) / 1000 + "s");

    // const start = new Date().getTime();
    // for (const row of rows) {
    //     if (row.response) {
    //         pept2DataMap.set(row.peptide, new PeptideData(bufferToArrayBuffer(row.response)));
    //     }
    // }
    // const end = new Date().getTime();
    // console.log("Setting values in map: " + (end - start) / 1000 + "s");

    const trustRow = db.prepare("SELECT * FROM peptide_trust WHERE `assay_id` = ?").get(assayId);
    const peptideTrust = new PeptideTrust(
        JSON.parse(trustRow.missed_peptides),
        trustRow.matched_peptides,
        trustRow.searched_peptides
    );

    return [Transfer(indexBuffer), Transfer(dataBuffer), peptideTrust]
}

export function writePept2Data(
    installationDir: string,
    peptideCounts: Map<Peptide, number>,
    peptDataIndexBuffer: SharedArrayBuffer,
    peptDataDataBuffer: SharedArrayBuffer,
    peptideTrust: PeptideTrust,
    assayId: string,
    dbFile: string
) {
    // const pept2DataResponses = new ShareableMap<string, PeptideData>(0, 0, new PeptideDataSerializer());
    // pept2DataResponses.setBuffers(
    //     peptDataIndexBuffer,
    //     peptDataDataBuffer
    // );

    //@ts-ignore
    const db = new Database(dbFile, { timeout: 15000 }, installationDir);
    db.pragma("journal_mode = WAL");

    // First delete all existing rows for this assay;
    db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);

    const start = new Date().getTime();
    db.prepare("INSERT INTO pept2data VALUES (?, ?, ?)").run(
        assayId,
        arrayBufferToBuffer(peptDataIndexBuffer),
        arrayBufferToBuffer(peptDataDataBuffer)
    );
    // const insertMany = db.transaction((data) => {
    //     for (const peptide of data) {
    //         const response = pept2DataResponses.get(peptide);
    //         if (response) {
    //             insert.run(assayId, peptide, arrayBufferToBuffer(response.buffer));
    //         } else {
    //             insert.run(assayId, peptide, null);
    //         }
    //     }
    // });
    // insertMany(peptideCounts.keys());
    const end = new Date().getTime();
    console.log("Write transaction took: " + (end - start) / 1000 + "s");

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
