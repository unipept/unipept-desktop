import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import { promises as fs } from "fs";
import { ProteomicsAssay, IOException, QueueManager } from "unipept-web-components";
import SearchConfigFileSystemDestroyer from "@/logic/filesystem/configuration/SearchConfigFileSystemDestroyer";
import { Database } from "better-sqlite3";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import CachedResultsManager from "@/logic/filesystem/assay/processed/CachedResultsManager";
import path from "path";
import { Store } from "vuex";

/**
 * Removes both the metadata and raw data for an assay.
 */
export default class AssayFileSystemDestroyer extends FileSystemAssayVisitor {
    constructor(
        directoryPath: string,
        dbManager: DatabaseManager,
        private readonly store: Store<any>
    ) {
        super(directoryPath, dbManager);
    }


    /**
     * @throws {IOException}
     */
    public async visitProteomicsAssay(assay: ProteomicsAssay): Promise<void> {
        const assayPath: string = `${this.directoryPath}${assay.getName()}.pep`;

        try {
            await fs.unlink(assayPath);
        } catch (err) {
            // File does no longer exist, which is not an issue here.
        }

        const assayId = assay.getId();

        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assayId);
            db.prepare("DELETE FROM storage_metadata WHERE `assay_id` = ?").run(assayId);
            db.prepare("DELETE FROM assays WHERE `id` = ?").run(assayId);
            db.prepare("DELETE FROM search_configuration WHERE `id` = ?").run(assay.getSearchConfiguration().id)
        });

        // Also delete cached results that might have possibly been created for this assay
        const cachedResultsMng = new CachedResultsManager(
            this.dbManager,
            path.dirname(this.directoryPath),
            this.store
        );

        await cachedResultsMng.deleteProcessingResults(assay);
    }
}
