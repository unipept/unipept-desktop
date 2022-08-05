import StorageMetadata from "@/logic/filesystem/metadata/StorageMetadata";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database } from "better-sqlite3";
import { StorageMetadataTableRow } from "@/logic/filesystem/database/Schema";
import SearchConfigManager from "@/logic/filesystem/configuration/SearchConfigManager";
import AnalysisSourceManager from "@/logic/filesystem/analysis/AnalysisSourceManager";
import { Store } from "vuex";
import { ProteomicsAssay } from "unipept-web-components";

export default class StorageMetadataManager {
    constructor(
        private readonly dbManager: DatabaseManager,
        private readonly projectLocation: string,
        private readonly store: Store<any>
    ) {}

    public async readMetadata(assay: ProteomicsAssay): Promise<StorageMetadata | undefined> {
        const metaRow = await this.dbManager.performQuery<StorageMetadataTableRow>((db: Database) => {
            return db.prepare("SELECT * FROM storage_metadata WHERE assay_id = ?").get(assay.getId());
        });

        if (metaRow) {
            const searchConfigMng = new SearchConfigManager(this.dbManager);

            const analysisSourceManager = new AnalysisSourceManager(
                this.dbManager,
                this.projectLocation,
                this.store
            );

            return new StorageMetadata(
                metaRow.assay_id,
                await searchConfigMng.readSearchConfig(metaRow.configuration_id),
                await analysisSourceManager.reviveAnalysisSource(assay, metaRow.analysis_source_id),
                metaRow.data_hash,
                new Date(metaRow.analysis_date)
            );
        }

        return undefined;
    }

    public async writeMetadata(metadata: StorageMetadata): Promise<void> {
        await this.dbManager.performQuery<void>((db: Database) => {

        });

        await this.dbManager.performQuery<void>((db: Database) => {
            return db.prepare(
                `
                    REPLACE INTO storage_metadata (assay_id, configuration_id, endpoint, fingerprint, data_hash, analysis_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                `
            ).run(
                metadata.assayId,
                metadata.searchConfiguration.id,

                metadata.dataHash,
                metadata.analysisDate.toJSON()
            );
        });
    }

    /**
     * Remove the metadata records from the database that are associated with the given assay id.
     *
     * @param assayId The assay id for which the associated metadata records should be removed.
     * @return true if the records were found and deleted from the database, false otherwise.
     */
    public async destroyMetadata(assayId: string): Promise<boolean> {
        return this.dbManager.performQuery<boolean>((db: Database) => {
            const runResult = db.prepare("DELETE FROM storage_metadata WHERE assay_id = ?").run(assayId);
            return runResult.changes !== 0;
        })
    }
}
