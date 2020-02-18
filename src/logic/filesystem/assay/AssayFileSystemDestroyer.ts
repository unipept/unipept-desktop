import FileSystemAssayVisitor from "src/logic/filesystem/assay/FileSystemAssayVisitor";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import fs from "fs";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";

export default class AssayFileSystemDestroyer extends FileSystemAssayVisitor {
    /**
     * @throws {IOException}
     */
    public async visitMetaProteomicsAssay(assay: Assay): Promise<void> {
        try {
            fs.unlinkSync(this.directoryPath + assay.getName());
        } catch (e) {
            throw new IOException(e);
        }
    }

    public async visitMetaGenomicsAssay(assay: Assay): Promise<void> {
        throw new Error("Not implemented");
    }
}