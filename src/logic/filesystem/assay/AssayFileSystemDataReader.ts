import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import * as fs from "fs";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    public async visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void> {
        throw new Error("Not implemented");
    }

    public async visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void> {
        const path: string = `${this.directoryPath}${mpAssay.getName()}.pep`;
        if (!fs.existsSync(path)) {
            return;
        }

        const peptidesString: string = fs.readFileSync(path, {
            encoding: "utf-8"
        });
        mpAssay.setPeptides(peptidesString.split(/\r?\n/));
    }
}