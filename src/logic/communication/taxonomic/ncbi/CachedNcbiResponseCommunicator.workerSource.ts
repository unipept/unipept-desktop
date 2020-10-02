import NcbiResponse from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponse";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { NcbiRank } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiRank";
import Database from "better-sqlite3";

export async function compute(
    [installationDir, dbPath, ncbiIds, output]: [string, string, NcbiId[], Map<NcbiId, NcbiResponse>]
): Promise<Map<NcbiId, NcbiResponse>> {
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
