import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import { promises as fs } from "fs";
import { ProteomicsAssay, Study } from "unipept-web-components";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database, RunResult } from "better-sqlite3";
import AnalysisSourceSerializer from "@/logic/filesystem/analysis/AnalysisSourceSerializer";
import { AssayTableRow } from "@/logic/filesystem/database/Schema";

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
        private readonly study: Study
    ) {
        super(directoryPath, dbManager);
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        // Write search configuration to database
        const config = mpAssay.getSearchConfiguration();

        await this.dbManager.performQuery<void>((db: Database) => {
            const info = db.prepare(
                `
                    REPLACE INTO search_configuration (equate_il, filter_duplicates, missing_cleavage_handling)
                    VALUES (?, ?, ?)
                `
            ).run(
                config.equateIl ? 1 : 0,
                config.filterDuplicates ? 1 : 0,
                config.enableMissingCleavageHandling ? 1 : 0,
            );

            config.id = info.lastInsertRowid.toString();
        });

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

        // Write assay metadata to the database
        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare(
                "REPLACE INTO assays (id, name, study_id, configuration_id, endpoint) VALUES (?, ?, ?, ?, ?)"
            ).run(
                mpAssay.getId(),
                mpAssay.getName(),
                this.study.getId(),
                config.id,
                AnalysisSourceSerializer.serializeAnalysisSource(mpAssay.getAnalysisSource())
            );
        });
    }
}
