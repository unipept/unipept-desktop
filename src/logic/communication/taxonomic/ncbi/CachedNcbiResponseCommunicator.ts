import { NcbiResponseCommunicator, NcbiId, NcbiResponse, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import { Database } from "better-sqlite3";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { NcbiRank } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiRank";

export default class CachedNcbiResponseCommunicator extends NcbiResponseCommunicator {
    private readonly db: Database;
    private static codesProcessed: Map<NcbiId, NcbiResponse> = new Map<NcbiId, NcbiResponse>();

    private static staticDbProgress: Promise<NcbiId[]>;
    private static worker: Worker;

    constructor() {
        super();
        try {
            const staticDatabaseManager = new StaticDatabaseManager();
            this.db = staticDatabaseManager.getDatabase();
        } catch (err) {
            console.error(err);
            console.warn("Gracefully falling back to online communicators...");
        }
    }

    public async process(codes: NcbiId[]): Promise<void> {
        if (!this.db) {
            await super.process(codes);
        } else {
            const ranks = Object.values(NcbiRank).map(rank => rank.replace(" ", "_"));
            const lineagesToExtract: NcbiId[] = [];

            let extractStmt = this.db.prepare(
                "SELECT * FROM taxons INNER JOIN lineages ON taxons.id = lineages.taxon_id WHERE `id` = ?"
            );

            for (const id of codes) {
                if (id) {
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
            }

            extractStmt = this.db.prepare(
                "SELECT * FROM taxons INNER JOIN lineages ON taxons.id = lineages.taxon_id WHERE `id` = ?"
            );

            for (const id of lineagesToExtract.filter(
                (c) => !CachedNcbiResponseCommunicator.codesProcessed.has(c)
            )) {
                if (id) {
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
            }
        }
    }

    public getResponse(id: NcbiId): NcbiResponse {
        if (!this.db) {
            return super.getResponse(id);
        }
        return CachedNcbiResponseCommunicator.codesProcessed.get(id);
    }

    public getResponseMap(): Map<NcbiId, NcbiResponse> {
        if (!this.db) {
            return super.getResponseMap();
        }
        return CachedNcbiResponseCommunicator.codesProcessed;
    }

    /**
     * Returns the amount of NCBI taxa that are known to the database underlying the application. An optional filter
     * string can be given that allows the database to be filtered by all taxa that contain a specific text in their
     * name.
     *
     * @param filter A portion of text that should be present in the name of all taxa that are returned by this
     * function.
     * */
    public getNcbiCount(filter = ""): number {
        if (filter !== "") {
            return this.db.prepare(
                "SELECT COUNT(id) FROM virtual_taxons WHERE virtual_taxons MATCH ? AND name != 'root'"
            )
                .get(filter)["COUNT(id)"];
        } else {
            return this.db.prepare("SELECT COUNT(id) FROM taxons WHERE name != 'root'")
                .get()["COUNT(id)"];
        }
    }

    /**
     * Returns a slice of all NCBI id's from the database starting from row number start (inclusive) and ending at end
     * (exclusive). Note that if a specific name filter is given, only taxa that contain this text as portion of their
     * name will be returned.
     *
     * @param start First NCBI id that should be included in the result (inclusive).
     * @param end First NCBI id that should not be included in the result (exclusive).
     * @param filter Only rows for which either the id, the name or rank contain a portion of this filter are returned.
     * @param sortBy Which taxon property should be used to sort the table?
     * @param sortDescending Sort according to ascending or descending values in the selected column?
     */
    public getNcbiRange(
        start: number,
        end: number,
        filter = "",
        sortBy: "id" | "name" | "rank" = "id",
        sortDescending = false
    ): NcbiId[] {
        if (filter !== "") {
            return this.db.prepare(
                `SELECT id FROM virtual_taxons WHERE virtual_taxons MATCH ? AND name != 'root' ORDER BY ${sortBy} ${ sortDescending ? "DESC": "ASC" } LIMIT ? OFFSET ?`
            )
                .all(filter, end - start, start)
                .map((item: any) => item.id);
        } else {
            return this.db.prepare(
                `SELECT id FROM taxons WHERE name != 'root' ORDER BY ${sortBy} ${ sortDescending ? "DESC": "ASC" } LIMIT ? OFFSET ?`
            )
                .all(end - start, start)
                .map((item: any) => item.id);
        }
    }
}
