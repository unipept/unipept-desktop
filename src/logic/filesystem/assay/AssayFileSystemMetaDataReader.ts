import { Database, Statement } from "better-sqlite3";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { ProteomicsAssay, SearchConfiguration, Study } from "unipept-web-components";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

export default class AssayFileSystemMetaDataReader extends FileSystemAssayVisitor {
    constructor(
        directoryPath: string,
        dbManager: DatabaseManager,
        private readonly study?: Study
    ) {
        super(directoryPath, dbManager);
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        let row = await this.dbManager.performQuery<any>(
            (db: Database) => db.prepare("SELECT * FROM assays WHERE assays.id = ?").get(mpAssay.getId())
        );

        if (!row && this.study) {
            // Try to find information about this assay by name and study id.
            row = await this.dbManager.performQuery<any>((db: Database) => {
                return db.prepare("SELECT * FROM assays WHERE name = ? AND study_id = ?").get(
                    mpAssay.getName(),
                    this.study.getId()
                );
            })
        }

        if (row) {
            mpAssay.id = row.id;

            const metadataRow = await this.dbManager.performQuery<any>((db: Database) => {
                return db.prepare(
                    "SELECT * FROM storage_metadata WHERE assay_id = ?"
                ).get(mpAssay.getId());
            })

            let config: SearchConfiguration;

            if (metadataRow) {
                mpAssay.setEndpoint(metadataRow.endpoint);
                mpAssay.setDatabaseVersion(metadataRow.db_version);
                mpAssay.setDate(new Date(metadataRow.analysis_date));
                config = new SearchConfiguration(
                    true,
                    true,
                    false,
                    metadataRow.configuration_id
                );
                const configReader = new SearchConfigFileSystemReader(this.dbManager);
                configReader.visitSearchConfiguration(config);
            } else {
                config = new SearchConfiguration();
            }

            mpAssay.setSearchConfiguration(config);
        }
    }
}
