import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import { promises as fs } from "fs";
import { ProteomicsAssay, Study } from "unipept-web-components";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database } from "better-sqlite3";
import { AssayTableRow } from "@/logic/filesystem/database/Schema";
import SearchConfigManager from "@/logic/filesystem/configuration/SearchConfigManager";
import AnalysisSourceManager from "@/logic/filesystem/analysis/AnalysisSourceManager";
import { Store } from "vuex";

/**
 * Visitor that writes the raw data associated with an assay to disk. This raw data can become rather large, which is
 * why it is stored separately from the metadata.
 *
 * @see AssayFileSystemMetaDataWriter
 */
export default class AssayFileSystemDataWriter extends FileSystemAssayVisitor {
    constructor(
        directoryPath: string,
        dbManager: DatabaseManager,
        private readonly study: Study,
        private readonly projectLocation: string,
        private readonly store: Store<any>
    ) {
        super(directoryPath, dbManager);
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        // Write search configuration to database
        const config = mpAssay.getSearchConfiguration();

        const searchConfigMng = new SearchConfigManager(this.dbManager);
        await searchConfigMng.writeSearchConfig(config);

        // Get previous assay metadata results (if they exist)
        const oldAssayRow = await this.dbManager.performQuery<AssayTableRow>(
            (db: Database) => db.prepare("SELECT * FROM assays WHERE id = ?").get(mpAssay.getId())
        );

        if (oldAssayRow) {
            // Remove old peptides file
            try {
                fs.unlink(`${this.directoryPath}${oldAssayRow.name}.pep`)
            } catch (e) {
                // Ignore error, since this simply means that the file was already deleted.
            }
        }

        // Write peptides to a file
        await fs.writeFile(
            `${this.directoryPath}${mpAssay.getName()}.pep`,
            mpAssay.getPeptides().join("\n") + "\n",
            {
                encoding: "utf-8"
            }
        );

        const source = mpAssay.getAnalysisSource();
        const analysisSourceMng = new AnalysisSourceManager(this.dbManager, this.projectLocation, this.store);
        const analysisSourceId = await analysisSourceMng.writeAnalysisSource(source, oldAssayRow?.analysis_source_id);

        // Write assay metadata to the database
        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare(
                "REPLACE INTO assays (id, name, study_id, configuration_id, analysis_source_id) VALUES (?, ?, ?, ?, ?)"
            ).run(
                mpAssay.getId(),
                mpAssay.getName(),
                this.study.getId(),
                config.id,
                analysisSourceId
            );
        });
    }
}
