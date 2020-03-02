import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import fs from "fs";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import { FileEventType } from "@/logic/filesystem/project/FileEventType";

/**
 * Removes both the metadata and raw data for an assay.
 */
export default class AssayFileSystemDestroyer extends FileSystemAssayVisitor {
    /**
     * @throws {IOException}
     */
    public async visitMetaProteomicsAssay(assay: Assay): Promise<void> {
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

    public async visitMetaGenomicsAssay(assay: Assay): Promise<void> {
        throw new Error("Not implemented");
    }

    public async getExpectedFileEvents(assay: Assay): Promise<FileEvent[]> {
        return [
            new FileEvent(FileEventType.RemoveFile, `${this.directoryPath}${assay.getName()}.pep`)
        ]
    }
}