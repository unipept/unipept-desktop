import AssayManager from "@common/assay/AssayManager";
import DatabaseManager from "@main/database/DatabaseManager";
import { Assay, Peptide } from "unipept-web-components";
import { promises as fs } from "fs";
import createWorker from "./PeptideReaderWorker?nodeWorker";
import { Worker } from "worker_threads";
import { AssayTableRow } from "@main/database/schemas/Schema";
import { Database as DbType } from "better-sqlite3";
import Project from "@common/project/Project";
import path from "path";
import Study from "@common/study/Study";

export default class FileSystemAssayManager implements AssayManager {
    private static inProgress: Promise<string[]> | undefined
    private static worker: Worker;

    public constructor(
        private readonly dbManager: DatabaseManager,
        private readonly project: Project,
        private readonly study: Study
    ) {}

    public async loadAssay(
        assayName: string,
        assayId: string
    ): Promise<Assay> {
        const assayPath = `${path.join(this.project.location, this.study.getName(), assayName)}.pep`;

        // First, try to read in all the peptides for this assay.
        const peptidesString: string = await fs.readFile(assayPath, {
            encoding: "utf-8"
        });

        while (FileSystemAssayManager.inProgress) {
            await FileSystemAssayManager.inProgress;
        }

        FileSystemAssayManager.inProgress = new Promise<string[]>((resolve) => {
            if (!FileSystemAssayManager.worker) {
                const eventListener = (peptides: Peptide[]) => {
                    FileSystemAssayManager.worker.removeListener("message", eventListener);
                    resolve(peptides);
                };

                FileSystemAssayManager.worker = createWorker({ workerData: 'worker'})
                    .on("message", eventListener);

                FileSystemAssayManager.worker.postMessage(peptidesString);
            }
        });

        const splittedPeptides = await FileSystemAssayManager.inProgress;
        FileSystemAssayManager.inProgress = undefined;

        // Then, try and read all the metadata associated with this assay
        const assayRow = await this.dbManager.performQuery<AssayTableRow | undefined>(
            (db: DbType) => db.prepare("SELECT * FROM assays WHERE assays.id = ?").get(assayId) as AssayTableRow | undefined
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
        }
    }

    public async removeAssay(assayName: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    public async writeAssay(assay: Assay): Promise<void> {
        return Promise.resolve(undefined);
    }
}
