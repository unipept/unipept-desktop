import { Statement } from "better-sqlite3";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";

export default class AssayFileSystemMetaDataReader extends FileSystemAssayVisitor {
    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const row = this.db.prepare("SELECT * FROM assays WHERE `id`=?").get(mpAssay.getId());
        if (row) {
            // Nothing needs to be retrieved at this point (metadata will be added later).

        }
    }
}
