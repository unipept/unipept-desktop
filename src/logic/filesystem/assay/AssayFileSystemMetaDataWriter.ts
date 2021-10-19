import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { Database, RunResult } from "better-sqlite3";
import {
    Study,
    ProteomicsAssay,
    SearchConfiguration
} from "unipept-web-components";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import AnalysisSourceSerializer from "@/logic/filesystem/analysis/AnalysisSourceSerializer";

export class AssayFileSystemMetaDataWriter extends FileSystemAssayVisitor {
    protected readonly study: Study;

    public constructor(directoryPath: string, dbManager: DatabaseManager, study: Study) {
        super(directoryPath, dbManager);
        this.study = study
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        await this.saveAssayMetaData(mpAssay);
    }

    private async saveAssayMetaData(mpAssay: ProteomicsAssay): Promise<void> {
        let searchConfig = mpAssay.getSearchConfiguration();
        if (!searchConfig) {
            searchConfig = new SearchConfiguration();
            mpAssay.setSearchConfiguration(searchConfig);
        }

        const searchConfigWriter = new SearchConfigFileSystemWriter(this.dbManager);
        searchConfigWriter.visitSearchConfiguration(searchConfig);

        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare(
                "REPLACE INTO assays (id, name, study_id, configuration_id, endpoint) VALUES (?, ?, ?, ?, ?)"
            ).run(
                mpAssay.getId(),
                mpAssay.getName(),
                this.study.getId(),
                searchConfig.id,
                AnalysisSourceSerializer.serializeAnalysisSource(mpAssay.getAnalysisSource())
            );
        });
    }
}
