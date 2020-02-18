import FileSystemAssayVisitor from "src/logic/filesystem/assay/FileSystemAssayVisitor";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import * as fs from "fs";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";

export default class AssayFileSystemWriter extends FileSystemAssayVisitor implements AssayVisitor {
    visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void> {
        const toWrite = {
            "id": mpAssay.getId(),
            "date": mpAssay.getDate()
        };

        try {
            fs.writeFileSync(
                `${this.directoryPath}${mpAssay.getName()}.json`,
                JSON.stringify(toWrite),
                {
                    encoding: "utf-8"
                }
            );
        } catch (err) {
            throw new IOException(err);
        }
    }
}
