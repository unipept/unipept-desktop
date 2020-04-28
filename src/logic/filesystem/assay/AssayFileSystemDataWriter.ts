import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import * as fs from "fs";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";

/**
 * Visitor that writes the raw data associated with an assay to disk. This raw data can become rather large, which is
 * why it is stored separately from the metadata.
 *
 * @see AssayFileSystemMetaDataWriter
 */
export default class AssayFileSystemDataWriter extends FileSystemAssayVisitor {
    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        fs.writeFileSync(
            `${this.directoryPath}${mpAssay.getName()}.pep`,
            mpAssay.getPeptides().join("\n"),
            {
                encoding: "utf-8"
            });
    }
}
