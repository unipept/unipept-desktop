import { Statement } from "better-sqlite3";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";

export default class AssayFileSystemMetaDataReader extends FileSystemAssayVisitor {
    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const row = this.db.prepare("SELECT * FROM assays WHERE assays.id = ?").get(mpAssay.getId());

        if (row) {
            const configuration = new SearchConfiguration();
            const configReader = new SearchConfigFileSystemReader(this.db);
            configReader.visitSearchConfiguration(configuration);
            mpAssay.setSearchConfiguration(configuration);
        }
    }
}
