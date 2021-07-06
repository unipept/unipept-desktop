import { NcbiResponseCommunicator, NcbiId, NcbiResponse, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import { Database } from "better-sqlite3";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { NcbiRank } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiRank";

export default class CachedNcbiResponseCommunicator extends NcbiResponseCommunicator {
    private readonly dbManager: DatabaseManager;
    private static codesProcessed: Map<NcbiId, NcbiResponse> = new Map<NcbiId, NcbiResponse>();

    constructor() {
        super();
        try {
            const staticDatabaseManager = new StaticDatabaseManager();
            this.dbManager = staticDatabaseManager.getDatabaseManager();
        } catch (err) {
            console.warn("Gracefully falling back to online communicators...");
        }
    }

    public async process(codes: NcbiId[]): Promise<void> {
        if (!this.dbManager) {
            await super.process(codes);
        } else {
            const ranks = Object.values(NcbiRank).map(rank => rank.replace(" ", "_"));
            const lineagesToExtract: NcbiId[] = [];

            await this.dbManager.performQuery<void>((db: Database) => {
                const extractStmt = db.prepare(
                    "SELECT * FROM taxons INNER JOIN lineages ON taxons.id = lineages.taxon_id WHERE `id` = ?"
                );

                for (const id of codes) {
                    const row = extractStmt.get(id);
                    if (row) {
                        const lineage = ranks.map(rank => row[rank]).map(el => el === "\\N" ? null : el);
                        lineagesToExtract.push(...lineage);

                        CachedNcbiResponseCommunicator.codesProcessed.set(id, {
                            id: row.id,
                            name: row.name,
                            rank: row.rank,
                            lineage: lineage
                        });
                    }
                }
            });

            await this.dbManager.performQuery<void>((db: Database) => {
                const extractStmt = db.prepare(
                    "SELECT * FROM taxons INNER JOIN lineages ON taxons.id = lineages.taxon_id WHERE `id` = ?"
                );

                for (const id of lineagesToExtract.filter(
                    (c) => !CachedNcbiResponseCommunicator.codesProcessed.has(c)
                )) {
                    const row = extractStmt.get(id);
                    if (row) {
                        const lineage = ranks.map(rank => row[rank]).map(el => el === "\\N" ? null : el);

                        CachedNcbiResponseCommunicator.codesProcessed.set(id, {
                            id: row.id,
                            name: row.name,
                            rank: row.rank,
                            lineage: lineage
                        });
                    }
                }
            });
        }
    }

    public getResponse(id: NcbiId): NcbiResponse {
        if (!this.dbManager) {
            return super.getResponse(id);
        }
        return CachedNcbiResponseCommunicator.codesProcessed.get(id);
    }

    public getResponseMap(): Map<NcbiId, NcbiResponse> {
        if (!this.dbManager) {
            return super.getResponseMap();
        }
        return CachedNcbiResponseCommunicator.codesProcessed;
    }

    public getAllNcbiIds(): Promise<NcbiId[]> {
        return this.dbManager.performQuery<NcbiId[]>((db: Database) => {
            return db.prepare(
                "SELECT id FROM taxons"
            ).all();
        });
    }
}
