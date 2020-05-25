import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { Database, RunResult } from "better-sqlite3";
import Study from "unipept-web-components/src/business/entities/study/Study";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";

export class AssayFileSystemMetaDataWriter extends FileSystemAssayVisitor {
    protected readonly study: Study;

    public constructor(directoryPath: string, db: Database, study: Study) {
        super(directoryPath, db);
        this.study = study
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        // Check if this study was saved before.
        const queryResults = this.db.prepare(
            `
                SELECT * FROM assays 
                INNER JOIN search_configuration ON assays.configuration_id = search_configuration.id WHERE assays.id=?
            `
        ).get(mpAssay.getId());

        let searchConfig = mpAssay.getSearchConfiguration();
        if (!searchConfig) {
            searchConfig = new SearchConfiguration();
            mpAssay.setSearchConfiguration(searchConfig);
        }

        const searchConfigWriter = new SearchConfigFileSystemWriter(this.db);
        searchConfigWriter.visitSearchConfiguration(searchConfig);

        if (queryResults) {
            this.db.prepare("UPDATE assays SET name = ?, study_id = ?, configuration_id = ? WHERE id = ?").run(
                mpAssay.getName(),
                this.study.getId(),
                searchConfig.id,
                mpAssay.id
            );
        } else {
            this.db.prepare("INSERT INTO assays (id, name, study_id, configuration_id) VALUES (?, ?, ?, ?)")
                .run(mpAssay.getId(), mpAssay.getName(), this.study.getId(), searchConfig.id);
        }
    }
}
