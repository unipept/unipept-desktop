import NcbiResponse from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponse";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { NcbiRank } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiRank";
import { expose } from "threads/worker";
import Database from "better-sqlite3";

expose({ process })

export default function process(installationDir: string, dbPath: string, ncbiIds: NcbiId[], output: Map<NcbiId, NcbiResponse>): Map<NcbiId, NcbiResponse> {
    // @ts-ignore
    const database = new Database(dbPath, {}, installationDir);

    const extractStmt = database.prepare(
        "SELECT * FROM taxons INNER JOIN lineages ON taxons.id = lineages.taxon_id WHERE `id` = ?"
    );

    for (const id of ncbiIds) {
        const row = extractStmt.get(id);
        if (row) {
            const lineage = Object.values(NcbiRank).map(rank => row[rank]).map(el => el === "\\N" ? null : el);
            output.set(id, {
                id: row.id,
                name: row.name,
                rank: row.rank,
                lineage: lineage
            });
        }
    }

    return output;
}
