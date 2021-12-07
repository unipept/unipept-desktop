import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { PeptideTrust } from "unipept-web-components";
import { PeptideTrustTableRow } from "@/logic/filesystem/database/Schema";
import { Database } from "better-sqlite3";

export default class PeptideTrustManager {
    constructor(
        private readonly dbManager: DatabaseManager
    ) {}

    public async readTrust(assayId: string): Promise<PeptideTrust | undefined> {
        const trustRow = await this.dbManager.performQuery<PeptideTrustTableRow>((db: Database) => {
            return db.prepare("SELECT * FROM peptide_trust WHERE assay_id = ?").get(assayId);
        });

        if (trustRow) {
            return new PeptideTrust(
                JSON.parse(trustRow.missed_peptides),
                trustRow.matched_peptides,
                trustRow.searched_peptides
            );
        }

        return undefined;
    }

    public async writeTrust(assayId: string, trust: PeptideTrust): Promise<void> {
        await this.dbManager.performQuery((db: Database) => {
            return db.prepare(
                `
                    REPLACE INTO peptide_trust (assay_id, missed_peptides, matched_peptides, searched_peptides)
                    VALUES (?, ?, ?, ?)
                `
            ).run(
                assayId,
                JSON.stringify(trust.missedPeptides),
                trust.matchedPeptides,
                trust.searchedPeptides
            );
        });
    }
}
