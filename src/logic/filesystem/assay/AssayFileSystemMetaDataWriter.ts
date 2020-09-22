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
        // Check if this study was saved before.
        const queryResults = this.db.prepare(
            `
                SELECT * FROM assays 
                INNER JOIN search_configuration ON assays.configuration_id = search_configuration.id WHERE assays.id = ?
            `
        ).get(mpAssay.getId());

        let searchConfig = mpAssay.getSearchConfiguration();
        if (!searchConfig) {
            searchConfig = new SearchConfiguration();
            mpAssay.setSearchConfiguration(searchConfig);
        }

        const searchConfigWriter = new SearchConfigFileSystemWriter(this.db);
        searchConfigWriter.visitSearchConfiguration(searchConfig);

        console.log("Setting endpoint to: " + mpAssay.getEndpoint());

        if (queryResults) {
            this.db.prepare(
                "UPDATE assays SET name = ?, study_id = ?, configuration_id = ?, endpoint = ?, db_version = ? WHERE id = ?"
            ).run(
                mpAssay.getName(),
                this.study.getId(),
                searchConfig.id,
                mpAssay.getEndpoint(),
                mpAssay.getDatabaseVersion(),
                mpAssay.id
            );
        } else {
            this.db.prepare(
                "INSERT INTO assays (id, name, study_id, configuration_id, endpoint, db_version) VALUES (?, ?, ?, ?, ?, ?)"
            ).run(
                mpAssay.getId(),
                mpAssay.getName(),
                this.study.getId(),
                searchConfig.id,
                mpAssay.getEndpoint(),
                mpAssay.getDatabaseVersion()
            );
        }

        console.log("Now in db: ");
        console.log(this.db.prepare("SELECT * FROM assays WHERE id = ?").get(mpAssay.getId()));
    }
}
