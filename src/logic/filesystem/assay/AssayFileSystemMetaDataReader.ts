import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import { Statement } from "better-sqlite3";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";

export default class AssayFileSystemMetaDataReader extends FileSystemAssayVisitor {
    public async visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void> {
        throw new Error("not implemented");
    }

    public async visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void> {
        const row = this.db.prepare("SELECT * FROM assays WHERE `id`=?").get(mpAssay.getId());
        if (row) {
            // Nothing needs to be retrieved at this point (metadata will be added later).
        }
    }
}