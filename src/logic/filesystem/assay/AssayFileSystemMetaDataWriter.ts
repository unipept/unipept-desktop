import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { Database, RunResult } from "better-sqlite3";
import { Study, ProteomicsAssay, SearchConfiguration } from "unipept-web-components";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";

export class AssayFileSystemMetaDataWriter extends FileSystemAssayVisitor {
    protected readonly study: Study;

    public constructor(directoryPath: string, db: Database, study: Study) {
        super(directoryPath, db);
        this.study = study
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        this.saveAssayMetaData(mpAssay);
    }

    private saveAssayMetaData(mpAssay: ProteomicsAssay): void {
        let searchConfig = mpAssay.getSearchConfiguration();
        if (!searchConfig) {
            searchConfig = new SearchConfiguration();
            mpAssay.setSearchConfiguration(searchConfig);
        }

        const searchConfigWriter = new SearchConfigFileSystemWriter(this.db);
        searchConfigWriter.visitSearchConfiguration(searchConfig);

        this.db.prepare(
            "REPLACE INTO assays (id, name, study_id) VALUES (?, ?, ?)"
        ).run(
            mpAssay.getId(),
            mpAssay.getName(),
            this.study.getId()
        );

        this.db.prepare(
            "REPLACE INTO storage_metadata (assay_id, configuration_id, endpoint, db_version, analysis_date) VALUES (?, ?, ?, ?, ?)"
        ).run(
            mpAssay.getId(),
            searchConfig.id,
            mpAssay.getEndpoint(),
            mpAssay.getDatabaseVersion(),
            mpAssay.getDate().toJSON()
        )
    }
}
