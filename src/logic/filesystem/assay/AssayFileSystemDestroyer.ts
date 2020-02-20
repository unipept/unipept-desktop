import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import fs from "fs";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import {FileEventType} from "@/logic/filesystem/project/FileEventType";

/**
 * Removes both the metadata and raw data for an assay.
 */
export default class AssayFileSystemDestroyer extends FileSystemAssayVisitor {
    /**
     * @throws {IOException}
     */
    public async visitMetaProteomicsAssay(assay: Assay): Promise<void> {
        try {
            fs.unlinkSync(`${this.directoryPath}${assay.getName()}.json`);
            fs.unlinkSync(`${this.directoryPath}${assay.getName()}.txt`);
        } catch (e) {
            throw new IOException(e);
        }
    }

    public async visitMetaGenomicsAssay(assay: Assay): Promise<void> {
        throw new Error("Not implemented");
    }

    public async getExpectedFileEvents(assay: Assay): Promise<FileEvent[]> {
        return [
            new FileEvent(FileEventType.RemoveFile, `${this.directoryPath}${assay.getName()}.json`),
            new FileEvent(FileEventType.RemoveFile, `${this.directoryPath}${assay.getName()}.txt`)
        ]
    }
}