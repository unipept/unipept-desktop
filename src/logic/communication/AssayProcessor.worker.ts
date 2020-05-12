import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { PeptideDataResponse } from "unipept-web-components/src/business/communication/peptides/PeptideDataResponse";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
// import Database from "better-sqlite3";
import { expose } from "threads";
import Database from "better-sqlite3";
import { GoCode } from "unipept-web-components/src/business/ontology/functional/go/GoDefinition";
import { EcCode } from "unipept-web-components/src/business/ontology/functional/ec/EcDefinition";
import { InterproCode } from "unipept-web-components/src/business/ontology/functional/interpro/InterproDefinition";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";

expose({ readPept2Data, writePept2Data, extractAnnotations });

export function readPept2Data(dbFile: string, assayId: string): [Map<Peptide, PeptideDataResponse>, PeptideTrust] {
    const start = new Date().getTime();

    const db = new Database(dbFile);
    db.pragma("journal_mode = WAL");
    const pept2DataMap = new Map<Peptide, PeptideDataResponse>();
    for (const row of db.prepare("SELECT * FROM pept2data WHERE `assay_id` = ?").all(assayId)) {
        pept2DataMap.set(row.peptide, JSON.parse(row.response));
    }

    const trustRow = db.prepare("SELECT * FROM peptide_trust WHERE `assay_id` = ?").get(assayId);
    const peptideTrust = new PeptideTrust(
        JSON.parse(trustRow.missed_peptides),
        trustRow.matched_peptides,
        trustRow.searched_peptides
    );

    const end = new Date().getTime();
    console.log("Read from db took " + (end - start) / 1000 + "s");

    return [pept2DataMap, peptideTrust];
}

export function writePept2Data(
    peptideCounts: Map<Peptide, number>,
    pept2DataResponses: Map<Peptide, PeptideDataResponse>,
    peptideTrust: PeptideTrust,
    assayId: string,
    dbFile: string
) {
    const start = new Date().getTime();

    const db = new Database(dbFile);

    // First delete all existing rows for this assay;
    db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assayId);
    db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);

    const insert = db.prepare("INSERT INTO pept2data VALUES (?, ?, ?)");
    const insertMany = db.transaction((data) => {
        for (const peptide of data) {
            insert.run(assayId, peptide, JSON.stringify(pept2DataResponses.get(peptide)))
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

    const end = new Date().getTime();
    console.log("Write to db took " + (end - start) / 1000 + "s");
}

/**
 * Extract all functional and taxonomic annotations from a given set of peptide responses.
 *
 * @param peptideCounts Mapping between peptide and it's frequency.
 * @param pept2DataResponses Maps each peptide onto a valid response that was returned by the Unipept endpoint.
 */
export function extractAnnotations(
    peptideCounts: Map<Peptide, number>,
    pept2DataResponses: Map<Peptide, PeptideDataResponse>
): [GoCode[], EcCode[], InterproCode[], NcbiId[]] {
    const start = new Date().getTime();
    const gos = new Set<GoCode>();
    const ecs = new Set<EcCode>();
    const iprs = new Set<InterproCode>();
    const ncbis = new Set<NcbiId>();

    for (const peptide of peptideCounts.keys()) {
        const response = pept2DataResponses.get(peptide);
        if (response) {
            Object.keys(response.fa.data).filter(x => x.startsWith("GO:")).map(x => gos.add(x));
            Object.keys(response.fa.data).filter(x => x.startsWith("EC:")).map(x => ecs.add(x));
            Object.keys(response.fa.data).filter(x => x.startsWith("IPR:")).map(x => iprs.add(x));
            ncbis.add(response.lca);
            response.lineage.filter(l => l).map(x => ncbis.add(x));
        }
    }

    const out = [Array.from(gos), Array.from(ecs), Array.from(iprs), Array.from(ncbis)];
    const end = new Date().getTime();
    console.log("In extract annotations worker " + (end - start) / 1000 + "s");
    //@ts-ignore
    return out;
}
