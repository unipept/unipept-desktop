import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { AnalysisSource, NcbiId, OnlineAnalysisSource, ProteomicsAssay } from "unipept-web-components";
import { AnalysisSourceTableRow } from "@/logic/filesystem/database/Schema";
import { Database, RunResult } from "better-sqlite3";
import CachedOnlineAnalysisSource from "@/logic/communication/analysis/CachedOnlineAnalysisSource";
import CustomDatabaseManager from "@/logic/filesystem/docker/CustomDatabaseManager";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import CachedCustomDbAnalysisSource from "@/logic/communication/analysis/CachedCustomDbAnalysisSource";
import { Store } from "vuex";

export default class AnalysisSourceManager {
    constructor(
        private readonly dbManager: DatabaseManager,
        private readonly projectLocation: string,
        private readonly store: Store<any>
    ) {}

    public async reviveAnalysisSource(
        assay: ProteomicsAssay,
        analysisSourceId: number
    ): Promise<AnalysisSource | null> {
        const sourceData = await this.dbManager.performQuery<AnalysisSourceTableRow>((db: Database) => {
            return db.prepare("SELECT * FROM analysis_source WHERE id = ?").get(analysisSourceId);
        });

        if (sourceData.type === "online") {
            return new CachedOnlineAnalysisSource(
                sourceData.endpoint,
                assay,
                this.dbManager,
                this.projectLocation,
                this.store
            );
        } else {
            const customDbManager = new CustomDatabaseManager();

            const selectedSources: string[] = [];
            if (sourceData.swissprot_selected === 1) {
                selectedSources.push("swissprot");
            }

            if (sourceData.trembl_selected === 1) {
                selectedSources.push("trembl");
            }

            const configMng = new ConfigurationManager();
            const customDbStorageLocation: string = (await configMng.readConfiguration()).customDbStorageLocation;

            const selectedTaxa: NcbiId[] = sourceData.selected_taxa.split(",").map(t => Number.parseInt(t));

            let possibleDb = await customDbManager.getDatabaseByProperties(
                selectedSources,
                selectedTaxa,
                sourceData.uniprot_version,
                customDbStorageLocation
            );

            if (!possibleDb) {
                console.log("Requested properties for db are not present...");
                console.log(selectedSources);
                console.log(selectedTaxa);
                console.log(sourceData.uniprot_version);

                // We need to create a new database and prepare it for construction by pushing it to the store.
                const newDbName: string = `${assay.getName()}_supporting_db`;
                await this.store.dispatch(
                    "customDatabases/buildDatabase",
                    [
                        // TODO: we need to make sure here that a DB with this name does not already exist in the system
                        newDbName,
                        selectedSources,
                        selectedTaxa,
                        sourceData.uniprot_version
                    ]
                );
                possibleDb = this.store.getters["customDatabases/database"](newDbName);
            }

            return new CachedCustomDbAnalysisSource(
                assay,
                this.dbManager,
                possibleDb,
                customDbStorageLocation,
                this.projectLocation,
                this.store
            );
        }
    }

    /**
     * Serialize and write this AnalysisSource to the project database.
     *
     * @param source The AnalysisSource that should be written to the database.
     * @param sourceId If an ID for this AnalysisSource is known, this should also be passed using this parameter such
     * that the previous version of the AnalysisSource can be overwritten in the database with the latest version.
     * @return The internal database ID of the AnalysisSource as it was written to the database.
     */
    public async writeAnalysisSource(
        source: AnalysisSource,
        sourceId?: number
    ): Promise<number> {
        console.log("Write analysis source...");

        if (sourceId) {
            // The AnalysisSource has already been stored in the project database before, and can thus be overwritten.
            return this.dbManager.performQuery<number>((db: Database) => {
                if (source instanceof OnlineAnalysisSource || source instanceof CachedOnlineAnalysisSource) {
                    db.prepare(`
                        UPDATE analysis_source
                        SET
                            type = ?,
                            endpoint = ?,
                            uniprot_version = ?,
                            selected_taxa = ?,
                            swissprot_selected = ?,
                            trembl_selected = ?
                        WHERE
                            id = ?
                    `).run("online", source.endpoint, "N/A", "", 1, 1, sourceId);
                } else if (source instanceof CachedCustomDbAnalysisSource) {
                    console.log("Writing existing analysis source...");
                    console.log(JSON.stringify(source.customDatabase));
                    const customDb = source.customDatabase;
                    db.prepare(`
                        UPDATE analysis_source
                        SET
                            type = ?,
                            endpoint = ?,
                            uniprot_version = ?,
                            selected_taxa = ?,
                            swissprot_selected = ?,
                            trembl_selected = ?
                        WHERE
                            id = ?
                    `).run(
                        "custom_db",
                        "",
                        customDb.databaseVersion,
                        customDb.taxa.join(","),
                        customDb.sourceTypes.includes("swissprot") ? 1 : 0,
                        customDb.sourceTypes.includes("trembl") ? 1 : 0,
                        sourceId
                    );
                }

                return sourceId;
            });
        } else {
            return this.dbManager.performQuery<number>((db: Database) => {
                let runResult: RunResult;

                if (source instanceof OnlineAnalysisSource || source instanceof CachedOnlineAnalysisSource) {
                    runResult = db.prepare(`
                        INSERT INTO analysis_source (type, endpoint, uniprot_version, swissprot_selected, trembl_selected) 
                        VALUES (?, ?, ?, ?, ?)
                    `).run("online", source.endpoint, "N/A", 1, 1);
                } else if (source instanceof CachedCustomDbAnalysisSource) {
                    console.log("Write new AnalysisSource...");
                    console.log(JSON.stringify(source.customDatabase));
                    const customDb = source.customDatabase;

                    runResult = db.prepare(`
                        INSERT INTO analysis_source (
                            type, uniprot_version, selected_taxa, swissprot_selected, trembl_selected
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `).run(
                        "custom_db",
                        customDb.databaseVersion,
                        customDb.taxa.join(","),
                        customDb.sourceTypes.includes("swissprot") ? 1 : 0,
                        customDb.sourceTypes.includes("trembl") ? 1 : 0
                    );
                }

                return runResult.lastInsertRowid as number;
            });
        }
    }
}
