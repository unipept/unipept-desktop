import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import * as fs from "fs";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import {FileEventType} from "@/logic/filesystem/project/FileEventType";

/**
 * Visitor that writes the raw data associated with an assay to disk. This raw data can become rather large, which is
 * why it is stored separately from the metadata.
 *
 * @see AssayFileSystemMetaDataWriter
 */
export default class AssayFileSystemDataWriter extends FileSystemAssayVisitor {
    public async visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void> {
        throw new Error("not implemented");
    }

    public async visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void> {
        fs.writeFileSync(
            `${this.directoryPath}${mpAssay.getName()}.pep`,
            mpAssay.getPeptides().join("\n"),
            {
                encoding: "utf-8"
            });
    }

    public async getExpectedFileEvents(assay: Assay): Promise<FileEvent[]> {
        return [
            new FileEvent(FileEventType.AddFile, `${this.directoryPath}${assay.getName()}.pep`)
        ]
    }
}