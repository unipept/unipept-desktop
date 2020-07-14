import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import { expose } from "threads";
import Database from "better-sqlite3";
import { Transfer } from "threads/worker";
import { TransferDescriptor } from "threads/dist";
import { Observable } from "threads/observable";
import { ShareableMap } from "shared-memory-datastructures";
import ProjectManager from "@/logic/filesystem/project/ProjectManager";

expose({ readPept2Data, writePept2Data });

export type ReadResult = {
    type: "progress",
    value: number
} | {
    type: "result",
    value: [TransferDescriptor, TransferDescriptor, PeptideTrust]
};

export function readPept2Data(installationDir: string, dbFile: string, assayId: string): Observable<ReadResult> {
    // @ts-ignore
    return new Observable((observer) => {
        observer.next({
            type: "progress",
            value: 0.0
        });

        //@ts-ignore
        const db = new Database(dbFile, {}, installationDir, {
            timeout: ProjectManager.DB_TIMEOUT
        });

        const start = new Date().getTime();
        let rowsProcessed: number = 0;
        const rows = db.prepare("SELECT * FROM pept2data WHERE `assay_id` = ?").all(assayId);
        const end = new Date().getTime();
        console.log("Read transaction took: " + (end - start) / 1000 + "s");
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
    installationDir: string,
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

    //@ts-ignore
    const db = new Database(dbFile, {}, installationDir, {
        timeout: ProjectManager.DB_TIMEOUT
    });

    // First delete all existing rows for this assay;
    db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);

    const start = new Date().getTime();
    const insert = db.prepare("INSERT INTO pept2data VALUES (?, ?, ?)");
    const insertMany = db.transaction((data) => {
        for (const peptide of data) {
            insert.run(assayId, peptide, pept2DataResponses.get(peptide))
        }
    });
    insertMany(peptideCounts.keys());
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
