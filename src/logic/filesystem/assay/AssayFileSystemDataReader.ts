import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import * as fs from "fs";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
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
