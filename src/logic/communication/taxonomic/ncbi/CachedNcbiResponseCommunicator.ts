import NcbiResponseCommunicator from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponseCommunicator";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import NcbiResponse from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponse";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import { Database, Statement } from "better-sqlite3";
import { NcbiRank } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiRank";

export default class CachedNcbiResponseCommunicator extends NcbiResponseCommunicator {
    private readonly database: Database;
    private fallbackCommunicator: NcbiResponseCommunicator;
    private readonly extractStmt: Statement;
    private readonly codesToProcess: Set<NcbiId> = new Set<NcbiId>();

    constructor() {
        super();
        const staticDatabaseManager = new StaticDatabaseManager();
        try {
            this.database = staticDatabaseManager.getDatabase();
            this.extractStmt = this.database.prepare(
                "SELECT * FROM taxons INNER JOIN lineages ON taxons.id = lineages.taxon_id WHERE `id` = ?"
            );
        } catch (err) {
            console.warn("Gracefully falling back to online communicators...");
            this.database = null;
            this.fallbackCommunicator = new NcbiResponseCommunicator();
        }
    }

    public async process(codes: NcbiId[]): Promise<void> {
        if (!this.database) {
            await this.fallbackCommunicator.process(codes);
        } else {
            for (const code of codes) {
                this.codesToProcess.add(code);
            }
        }
    }

    public getResponse(id: NcbiId): NcbiResponse {
        if (!this.database) {
            return this.fallbackCommunicator.getResponse(id);
        } else {
            const row = this.extractStmt.get(id);
            if (row) {
                const lineage = Object.values(NcbiRank).map(rank => row[rank]).map(el => el === "\\N" ? null : el);
                return {
                    id: row.id,
                    name: row.name,
                    rank: row.rank,
                    lineage: lineage
                }
            }
            return undefined;
        }
    }

    public getResponseMap(): Map<NcbiId, NcbiResponse> {
        return super.getResponseMap();
    }
}
