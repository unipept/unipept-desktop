import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import { expose } from "threads";
import Database from "better-sqlite3";
import { Transfer } from "threads/worker";
import { TransferDescriptor } from "threads/dist";
import { Observable } from "threads/observable";
import { ShareableMap } from "shared-memory-datastructures";

expose({ readPept2Data, writePept2Data });

export type ReadResult = {
    type: "progress",
    value: number
} | {
    type: "result",
    value: [TransferDescriptor, TransferDescriptor, PeptideTrust]
};

export function readPept2Data(dbFile: string, assayId: string): Observable<ReadResult> {
    // @ts-ignore
    return new Observable((observer) => {
        observer.next({
            type: "progress",
            value: 0.0
        });

        const db = new Database(dbFile);
        db.pragma("journal_mode = WAL");

        let rowsProcessed: number = 0;
        const rows = db.prepare("SELECT * FROM pept2data WHERE `assay_id` = ?").all(assayId);
        const pept2DataMap = new ShareableMap<Peptide, string>(rows.length);
        for (const row of rows) {
            if (row.response) {
                pept2DataMap.set(row.peptide, row.response);
            }

            if (rowsProcessed % 25000 === 0) {
                observer.next({
                    type: "progress",
                    value: rowsProcessed / rows.length
                });
            }
            rowsProcessed++;
        }

        const trustRow = db.prepare("SELECT * FROM peptide_trust WHERE `assay_id` = ?").get(assayId);
        const peptideTrust = new PeptideTrust(
            JSON.parse(trustRow.missed_peptides),
            trustRow.matched_peptides,
            trustRow.searched_peptides
        );

        const buffers = pept2DataMap.getBuffers();
        observer.next({
            type: "result",
            value: [Transfer(buffers[0]), Transfer(buffers[1]), peptideTrust]
        });

        observer.complete();
    });
}

export function writePept2Data(
    peptideCounts: Map<Peptide, number>,
    peptDataIndexBuffer: SharedArrayBuffer,
    peptDataDataBuffer: SharedArrayBuffer,
    peptideTrust: PeptideTrust,
    assayId: string,
    dbFile: string
) {
    const pept2DataResponses = new ShareableMap(0, 0);
    pept2DataResponses.setBuffers(
        peptDataIndexBuffer,
        peptDataDataBuffer
    );

    const db = new Database(dbFile);

    // First delete all existing rows for this assay;
    db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);

    const insert = db.prepare("INSERT INTO pept2data VALUES (?, ?, ?)");
    const insertMany = db.transaction((data) => {
        for (const peptide of data) {
            insert.run(assayId, peptide, pept2DataResponses.get(peptide))
        }
    });
    insertMany(peptideCounts.keys());

    const insertTrust = db.prepare("INSERT INTO peptide_trust VALUES (?, ?, ?, ?)");
    insertTrust.run(
        assayId,
        JSON.stringify(peptideTrust.missedPeptides),
        peptideTrust.matchedPeptides,
        peptideTrust.searchedPeptides
    );
}
