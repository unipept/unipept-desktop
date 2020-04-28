import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import fs from "fs";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import IOException from "unipept-web-components/src/business/exceptions/IOException";

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
            if (fs.existsSync(path)) {
                fs.unlinkSync(`${this.directoryPath}${assay.getName()}.pep`);
            }

            // Also remove all metadata from the db
            this.db.prepare("DELETE FROM assays WHERE `id`=?").run(assay.getId());
        } catch (e) {
            throw new IOException(e);
        }
    }
}
