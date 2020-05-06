import { Statement } from "better-sqlite3";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";

export default class AssayFileSystemMetaDataReader extends FileSystemAssayVisitor {
    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const row = this.db.prepare(
            `
                SELECT * FROM assays 
                INNER JOIN search_configuration ON assays.configuration_id = search_configuration.id 
                WHERE assays.id=?
            `
        ).get(mpAssay.getId());

        if (row) {
            const configuration: SearchConfiguration = new SearchConfiguration(
                row.equate_il === 1,
                row.filter_duplicates === 1,
                row.missing_cleavage_handling === 1
            );

            mpAssay.setSearchConfiguration(configuration);
        }
    }
}
