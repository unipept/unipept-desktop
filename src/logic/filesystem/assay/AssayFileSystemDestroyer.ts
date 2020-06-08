import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import { promises as fs } from "fs";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import IOException from "unipept-web-components/src/business/exceptions/IOException";
import SearchConfigFileSystemDestroyer from "@/logic/filesystem/configuration/SearchConfigFileSystemDestroyer";

/**
 * Removes both the metadata and raw data for an assay.
 */
export default class AssayFileSystemDestroyer extends FileSystemAssayVisitor {
    /**
     * @throws {IOException}
     */
    public async visitProteomicsAssay(assay: ProteomicsAssay): Promise<void> {
        try {
            const path: string = `${this.directoryPath}${assay.getName()}.pep`;

            try {
                await fs.unlink(path);
            } catch (err) {
                // File does no longer exist, which is not an issue here.
            }

            // Also remove all metadata from the db
            this.db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assay.getId());
            this.db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assay.getId());
            this.db.prepare("DELETE FROM storage_metadata WHERE `assay_id` = ?").run(assay.getId());
            this.db.prepare("DELETE FROM assays WHERE `id` = ?").run(assay.getId());

            const configDestroyer = new SearchConfigFileSystemDestroyer(this.db);
            configDestroyer.visitSearchConfiguration(assay.getSearchConfiguration());
        } catch (e) {
            throw new IOException(e);
        }
    }
}
