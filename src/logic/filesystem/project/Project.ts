import { Database } from "better-sqlite3";
import Study from "unipept-web-components/src/business/entities/study/Study";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import AssayProcessor from "@/logic/communication/AssayProcessor";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import ProjectManager from "@/logic/filesystem/project/ProjectManager";
import Vue from "vue";
import FileSystemWatcher from "@/logic/filesystem/project/FileSystemWatcher";
import path from "path";

export type ProcessingResult = {
    progress: number,
    countTable: CountTable<Peptide>,
    errorStatus: string,
    trust: PeptideTrust,
    communicators: CommunicationSource,
    // When did the last chunk of data come in? (In milliseconds since epoch)
    startProcessingTime: number,
    // Estimate of total remaining processing time (in seconds)
    eta: number
};

/**
 * A project is a collection of studies. Every project is associated with a specific directory on the user's local
 * filesystem. Metadata about all studies and assays is stored in an SQLite-database in this directory, as well as
 * all raw data. Every directory in this project corresponds to a study, and every file inside of a study-directory
 * corresponds to the raw data of an assay.
 *
 * This class manages both the in-memory representation of a project, as well as it's representation on the local
 * filesystem. It makes sure that all changes to studies or assays are reflected in the local filesystem and vice-versa.
 *
 * @author Pieter Verschaffelt
 */
export default class Project {
    public readonly name: string;

    // The assay that's currently selected by the user as the active one. Will be null if no assay is currently active.
    public activeAssay: Assay = null;
    public watcher: FileSystemWatcher;

    // Maps assays to their processed counterparts. TODO: should be updated to a map, once we are using Vue 3.
    private processedAssays: {} = {};

    constructor(
        public readonly projectPath: string,
        public readonly db: Database,
        public readonly studies: Study[] = []
    ) {
        this.db = db;

        if (!this.projectPath.endsWith("/")) {
            this.projectPath += "/"
        }

        this.name = path.basename(this.projectPath);

        for (const assay of this.getAllAssays()) {
            this.processAssay(assay);
        }
    }

    public setWatcher(watcher: FileSystemWatcher) {
        this.watcher = watcher;
    }

    public setStudies(studies: Study[]) {
        this.studies.splice(0, this.studies.length);
        this.studies.push(...studies);
    }

    public getStudies(): Study[] {
        return this.studies;
    }

    /**
     * @return A list with all assays (over all studies) that are part of this project.
     */
    public getAllAssays(): ProteomicsAssay[] {
        return this.getStudies().reduce((acc, current) => acc.concat(current.getAssays()), []);
    }

    public activateAssay(assay: Assay): void {
        this.activeAssay = assay;
    }

    public getProcessingResults(
        assay: Assay
    ): ProcessingResult {
        if (!(assay.getId() in this.processedAssays)) {
            // Need to explicitly set this property using the Vue.set-method to allow for other components to listen
            // to changes to this object.
            Vue.set(this.processedAssays, assay.getId(), {
                progress: 0,
                countTable: undefined,
                errorStatus: undefined,
                trust: undefined,
                communicators: undefined,
                lastChunkStart: undefined,
                eta: undefined
            });
        }

        return this.processedAssays[assay.getId()];
    }

    /**
     * Sets the first fully processed assay to be the active one, only if no active assay is currently set. This
     * action checks whether the currently active assay is indeed a member of the selected assays. If not, another one
     * will be elected to be the active assay.
     */
    public resetActiveAssay() {
        let shouldReselect: boolean = true;
        if (this.activeAssay) {
            const idx: number = this.getAllAssays().findIndex(assay => assay.getId() === this.activeAssay.getId());
            shouldReselect = idx === -1;
        }

        if (shouldReselect) {
            let newActive: Assay = null;
            for (let current of this.getAllAssays()) {
                if (this.getProcessingResults(current).progress === 1) {
                    newActive = current;
                    break;
                }
            }

            this.activateAssay(newActive);
        }
    }

    public async processAssay(assay: ProteomicsAssay): Promise<void> {
        const processedItem = this.getProcessingResults(assay);
        processedItem.errorStatus = undefined;
        processedItem.progress = 0;
        processedItem.countTable = undefined;
        processedItem.trust = undefined;
        processedItem.communicators = undefined;
        processedItem.startProcessingTime = undefined;

        try {
            const assayProcessor = new AssayProcessor(
                this.db,
                this.projectPath + ProjectManager.DB_FILE_NAME,
                assay,
                {
                    onProgressUpdate: (progress: number) => {
                        if (!processedItem.startProcessingTime) {
                            processedItem.startProcessingTime = new Date().getTime();
                        }

                        processedItem.progress = progress

                        const elapsedTime = new Date().getTime() - processedItem.startProcessingTime;

                        if (elapsedTime > 500) {
                            const progressToDo = 1 - progress;
                            // Divide by 1000 to convert to seconds
                            const multiplier = progressToDo / progress;
                            processedItem.eta = (elapsedTime * multiplier) / 1000;
                        }
                    }
                }
            );

            const [countTable, communicators] = await assayProcessor.processAssay();

            processedItem.communicators = communicators;
            processedItem.countTable = countTable;
            processedItem.trust = await communicators.getPept2DataCommunicator().getPeptideTrust(
                countTable,
                assay.getSearchConfiguration()
            );
        } catch (err) {
            console.warn(err);
            if (!this.activeAssay) {
                this.activeAssay = assay;
            }
            processedItem.errorStatus = err.toString();
        }

        this.resetActiveAssay();
    }
}
