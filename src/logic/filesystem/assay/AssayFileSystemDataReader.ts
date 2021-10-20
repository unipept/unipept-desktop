import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { ProteomicsAssay, IOException, QueueManager, Assay, Study, SearchConfiguration } from "unipept-web-components";
import { promises as fs } from "fs";
import Worker from "worker-loader?inline=fallback!./AssayFileSystemDataReader.worker";
import { Database } from "better-sqlite3";
import {
    AssayTableRow,
    SearchConfigurationTableRow,
    StorageMetadataTableRow,
    StudyTableRow
} from "@/logic/filesystem/database/Schema";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import AnalysisSourceSerializer from "@/logic/filesystem/analysis/AnalysisSourceSerializer";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    private static inProgress: Promise<string[]>;
    private static worker: Worker;

    constructor(
        directoryPath: string,
        dbManager: DatabaseManager,
        private readonly projectLocation: string,
        private readonly study?: Study
    ) {
        super(directoryPath, dbManager);
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const path: string = `${this.directoryPath}${mpAssay.getName()}.pep`;

        // First, try to read in all of the peptides for this assay.
        const peptidesString: string = await fs.readFile(path, {
            encoding: "utf-8"
        });

        while (AssayFileSystemDataReader.inProgress) {
            await AssayFileSystemDataReader.inProgress;
        }

        AssayFileSystemDataReader.inProgress = new Promise<string[]>((resolve) => {
            if (!AssayFileSystemDataReader.worker) {
                AssayFileSystemDataReader.worker = new Worker();
            }

            const eventListener = (message: MessageEvent) => {
                AssayFileSystemDataReader.worker.removeEventListener("message", eventListener);
                resolve(message.data);
            };

            AssayFileSystemDataReader.worker.addEventListener("message", eventListener);

            AssayFileSystemDataReader.worker.postMessage(peptidesString);
        });

        const splitted = await AssayFileSystemDataReader.inProgress;
        AssayFileSystemDataReader.inProgress = undefined;

        mpAssay.setPeptides(splitted);

        // Then, try to read in the metadata associated with this assay.
        const assayRow = await this.dbManager.performQuery<AssayTableRow>(
            (db: Database) => db.prepare("SELECT * FROM assays WHERE assays.id = ?").get(mpAssay.getId())
        );

        if (assayRow) {
            // Also read in the metadata
            const metadataRow = await this.dbManager.performQuery<StorageMetadataTableRow>(
                (db: Database) => {
                    return db.prepare("SELECT * FROM storage_metadata WHERE assay_id = ?").get(mpAssay.getId());
                }
            );

            const searchConfigRow = await this.dbManager.performQuery<SearchConfigurationTableRow>(
                (db: Database) =>  {
                    return db.prepare("SELECT * FROM search_configuration WHERE id = ?")
                        .get(assayRow.configuration_id);
                }
            )

            const searchConfig = new SearchConfiguration(
                searchConfigRow.equate_il,
                searchConfigRow.filter_duplicates,
                searchConfigRow.missing_cleavage_handling,
                searchConfigRow.id.toString()
            );

            mpAssay.setName(assayRow.name);
            mpAssay.setSearchConfiguration(searchConfig);
            mpAssay.setAnalysisSource(
                await AnalysisSourceSerializer.deserializeAnalysisSource(
                    assayRow.endpoint,
                    mpAssay,
                    this.dbManager,
                    this.projectLocation
                )
            );

            if (metadataRow) {
                mpAssay.setDate(new Date(metadataRow.analysis_date));
            }
        } else {
            // Throw an exception, the assay was not found in the database
            throw new IOException();
        }
    }
}
