import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import {
    ProteomicsAssay,
    IOException,
    QueueManager,
    Assay,
    Study,
    SearchConfiguration,
    NetworkConfiguration, AnalysisSource, NcbiId
} from "unipept-web-components";
import { promises as fs } from "fs";
import Worker from "worker-loader?inline=fallback!./AssayFileSystemDataReader.worker";
import { Database } from "better-sqlite3";
import {
    AnalysisSourceTableRow,
    AssayTableRow,
} from "@/logic/filesystem/database/Schema";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import SearchConfigManager from "@/logic/filesystem/configuration/SearchConfigManager";
import StorageMetadataManager from "@/logic/filesystem/metadata/StorageMetadataManager";
import CachedOnlineAnalysisSource from "@/logic/communication/analysis/CachedOnlineAnalysisSource";
import { Store } from "vuex";
import AnalysisSourceManager from "@/logic/filesystem/analysis/AnalysisSourceManager";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    private static inProgress: Promise<string[]>;
    private static worker: Worker;

    constructor(
        directoryPath: string,
        dbManager: DatabaseManager,
        private readonly projectLocation: string,
        private readonly store: Store<any>,
        private readonly study?: Study
    ) {
        super(directoryPath, dbManager);
    }

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const path = `${this.directoryPath}${mpAssay.getName()}.pep`;

        // First, try to read in all the peptides for this assay.
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
            const metadataMng = new StorageMetadataManager(this.dbManager, this.projectLocation, this.store);
            const metadata = await metadataMng.readMetadata(mpAssay);

            const searchConfigMng = new SearchConfigManager(this.dbManager);
            mpAssay.setSearchConfiguration(await searchConfigMng.readSearchConfig(assayRow.configuration_id));

            const analysisSourceMng = new AnalysisSourceManager(this.dbManager, this.projectLocation, this.store);
            mpAssay.setAnalysisSource(
                await analysisSourceMng.reviveAnalysisSource(mpAssay, assayRow.analysis_source_id)
            );

            if (metadata) {
                mpAssay.setDate(metadata.analysisDate);
            }
        } else {
            mpAssay.setSearchConfiguration(new SearchConfiguration());
            mpAssay.setAnalysisSource(
                new CachedOnlineAnalysisSource(
                    NetworkConfiguration.BASE_URL,
                    mpAssay,
                    this.dbManager,
                    this.projectLocation,
                    this.store
                )
            );
        }
    }
}
