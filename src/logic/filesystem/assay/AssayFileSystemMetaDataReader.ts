import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import * as fs from "fs";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";

export default class AssayFileSystemMetaDataReader extends FileSystemAssayVisitor implements AssayVisitor {
    public async visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    public async visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void> {
        try {
            const data: string = fs.readFileSync(
                `${this.directoryPath}${mpAssay.getName()}.json`,
                {
                    encoding: "utf-8"
                }
            )
            const deserialized: any = JSON.parse(data);
            mpAssay.setId(deserialized.id);
            mpAssay.setName(deserialized.name);
        } catch (err) {
            throw new IOException(err);
        }
    }
}
