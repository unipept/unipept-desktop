import chokidar from "chokidar";
import StudyFileSystemWriter from "./../study/StudyFileSystemWriter";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";
import { v4 as uuidv4 } from "uuid";
import ErrorListener from "@/logic/filesystem/ErrorListener";
import FileSystemAssayChangeListener from "@/logic/filesystem/assay/FileSystemAssayChangeListener";
import StudyFileSystemRemover from "@/logic/filesystem/study/StudyFileSystemRemover";
import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import * as path from "path";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";
import { Database } from "better-sqlite3";
import StudyFileSystemReader from "@/logic/filesystem/study/StudyFileSystemReader";
import Study from "unipept-web-components/src/business/entities/study/Study";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import StudyVisitor from "unipept-web-components/src/business/entities/study/StudyVisitor";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import ChangeListener from "unipept-web-components/src/business/entities/ChangeListener";
import PeptideCountTableProcessor from "unipept-web-components/src/business/processors/raw/PeptideCountTableProcessor";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import AssayProcessor from "@/logic/communication/AssayProcessor";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import ProjectManager from "@/logic/filesystem/project/ProjectManager";


/**
 * A project is a collection of studies. Every project is associated with a specific directory on the user's local
 * filesystem. Metadata about all studies and assays is stored in an SQLite-database in this directory, as well as
 * all raw data. Every directory in this project corresponds to a study, and every file inside of a study-directory
 * corresponds to the raw data of an assay.
 *
 * This class manages both the in-memory representation of a project, as well as it's representation on the local
 * filesystem. It makes sure that all changes to studies or assays are reflected in the local filesystem and vice-versa.
 *
 * All changes that are performed to the filesystem should be known by this project, because it needs to know which
 * in-memory changes are associated to which changes to the local filesystem, reported by the OS.
 *
 * @author Pieter Verschaffelt
 */
export default class Project {
    public readonly studies: Study[] = [];
    public readonly projectPath: string;
    public readonly db: Database;

    // The assay that's currently selected by the user as the active one. Will be null if no assay is currently active.
    public activeAssay: Assay = null;

    // This queue keeps track of all actions that need to be performed. These actions may throw errors, and in the
    // event that an Error is thrown, the ErrorListener's of this class are informed and file synchronization stops
    // immediately.
    private readonly actionQueue: (() => Promise<void>)[] = [];
    private readonly syncInterval: number;

    private errorListeners: ErrorListener[] = [];

    // Maps assays to their processed counterparts. TODO: should be updated to a map, once we are using Vue 3.
    private processedAssays: {} = {};

    constructor(path: string, db: Database, syncInterval: number = 250) {
        this.db = db;
        this.projectPath = path;
        if (!this.projectPath.endsWith("/")) {
            this.projectPath += "/"
        }

        this.syncInterval = syncInterval;
    }

    /**
     * Initialize this project's event loop. This loop takes care of all write / read operations and makes sure that no
     * redundant accesses to the file system are performed. By initializing this project, a watcher will also be started
     * that monitors the filesystem for changes to which the project should then react.
     */
    public initialize() {
        const watcher = chokidar.watch(this.projectPath, {
            ignoreInitial: true,
            // Ignore hidden files and metadata changes
            ignored: /^\..*$|metadata.sqlite/,
            awaitWriteFinish: {
                stabilityThreshold: 1000,
                pollInterval: 100
            }
        });

        watcher
            .on("add", (path: string) => this.fileAdded(path))
            .on("change", (path: string) => this.fileChanged(path))
            .on("unlink", (path: string) => this.fileDeleted(path))
            .on("addDir", (path: string) => this.directoryAdded(path))
            .on("unlinkDir", (path: string) => this.directoryDeleted(path));

        this.flushQueue();
    }

    public addErrorListener(listener: ErrorListener) {
        this.errorListeners.push(listener);
    }

    public setStudies(studies: Study[]) {
        this.studies.splice(0, this.studies.length);
        this.studies.push(...studies);
    }

    public getStudies(): Study[] {
        return this.studies;
    }

    public createStudy(name: string, id?: string): Study {
        const study: Study = new Study(
            [
                new FileSystemStudyChangeListener(this),
                this.getProjectStudyWatcher()
            ],
            id ? id : uuidv4(),
            name
        );
        const studyWriter: FileSystemStudyVisitor = new StudyFileSystemWriter(`${this.projectPath}${name}/`, this);

        this.pushAction(async() => {
            await studyWriter.visitStudy(study);
        });

        this.studies.push(study);
        return study;
    }

    public createMetaProteomicsAssay(name: string, peptides: string[], study: Study): ProteomicsAssay {
        const assay: ProteomicsAssay = new ProteomicsAssay(
            [new FileSystemAssayChangeListener(this, study)],
            uuidv4(),
            new SearchConfiguration(),
            undefined,
            name,
            new Date()
        );
        assay.setPeptides(peptides);
        study.addAssay(assay);
        return assay;
    }

    public removeStudy(study: Study): void {
        const idx: number = this.studies.findIndex(item => item.getId() == study.getId());
        if (idx >= 0) {
            this.studies.splice(idx, 1);
        }
        // Also remove study from disk.
        this.pushAction(async() => {
            const studyRemover: StudyVisitor = new StudyFileSystemRemover(
                `${this.projectPath}${study.getName()}/`,
                this
            );
            await study.accept(studyRemover);
        });
        this.resetActiveAssay();
    }

    /**
     * Add a new asynchronous action to the action queue. All actions in this queue are automatically processed at a
     * fixed interval rate. These actions are executed "as soon as possible" and when expected by this project. All
     * operations that directly interact with the local filesystem should be performed through this function.
     *
     * This function requires knowledge of the FileEvent's that will occur as a result of executing this action.
     *
     * @param action An asynchronous function that should be executed as soon as possible. All actions passed through
     * this function are guaranteed to be executed in order.
     */
    public pushAction(action: () => Promise<void>) {
        this.actionQueue.push(action);
    }

    /**
     * @return A list with all assays (over all studies) that are part of this project.
     */
    public getAllAssays(): Assay[] {
        return this.getStudies().reduce((acc, current) => acc.concat(current.getAssays()), []);
    }

    public activateAssay(assay: Assay): void {
        this.activeAssay = assay;
    }

    public getProcessingResults(
        assay: Assay
    ): { progress: number, countTable: CountTable<Peptide>, errorStatus: string, trust: PeptideTrust, communicators: CommunicationSource } {
        if (!(assay.getId() in this.processedAssays)) {
            this.processedAssays[assay.getId()] = {
                progress: 0,
                countTable: undefined,
                errorStatus: undefined,
                trust: undefined,
                communicators: undefined
            }
        }

        return this.processedAssays[assay.getId()];
    }

    /**
     * Flushes the action queue at specific times, making sure that all operations are performed in order by waiting
     * for each operation to successfully succeed. Once such an operation files, the event loop is stopped and all
     * error listeners subscribed to this project are notified.
     */
    private async flushQueue() {
        try {
            while (this.actionQueue.length > 0) {
                const action: () => Promise<void> = this.actionQueue.shift();
                await action();
            }

            setTimeout(async() => this.flushQueue(), this.syncInterval);
        } catch (err) {
            for (const listener of this.errorListeners) {
                listener.handleError(err);
            }
        }
    }

    /**
     * Sets the first fully processed assay to be the active one, only if no active assay is currently set. This
     * action checks whether the currently active assay is indeed a member of the selected assays. If not, another one
     * will be elected to be the active assay.
     */
    private resetActiveAssay() {
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

    private async fileAdded(filePath: string) {
        if (filePath.endsWith(".pep")) {
            const studyName: string = path.basename(path.dirname(filePath));

            this.pushAction(async() => {
                const study: Study = this.studies.find(study => study.getName() === studyName);

                if (!study) {
                    return;
                }

                const assayName: string = path.basename(filePath).replace(".pep", "");

                // Check if an assay with this name already exists.
                if (study.getAssays().find(assay => assay.getName() === assayName)) {
                    return;
                }

                // Add a new MetaProteomicsAssay to it's corresponding study if it does not exist already.
                const assay: ProteomicsAssay = new ProteomicsAssay(
                    [new FileSystemAssayChangeListener(this, study)],
                    uuidv4(),
                    new SearchConfiguration(),
                    undefined,
                    assayName,
                    new Date()
                );

                const assayReader: FileSystemAssayVisitor = new AssayFileSystemDataReader(
                    this.projectPath + studyName,
                    this.db,
                    false
                );
                await assay.accept(assayReader);
                study.addAssay(assay);
            });
        }
    }

    private async directoryAdded(directoryPath: string) {
        if (!directoryPath.endsWith("/")) {
            directoryPath += "/";
        }

        const studyName: string = path.basename(directoryPath);

        if (this.studies.find(study => study.getName() === studyName)) {
            return;
        }

        const study: Study = new Study(
            [
                new FileSystemStudyChangeListener(this),
                this.getProjectStudyWatcher()
            ],
            uuidv4(),
            studyName
        );

        this.pushAction(async() => {
            const studyWriter: FileSystemStudyVisitor = new StudyFileSystemWriter(directoryPath, this);
            await study.accept(studyWriter);

            const studyReader: FileSystemStudyVisitor = new StudyFileSystemReader(directoryPath, this);
            await study.accept(studyReader);

            this.studies.push(study);
        });
    }

    private async fileChanged(filePath: string) {
        const studyName: string = path.basename(path.dirname(filePath));

        this.pushAction(async() => {
            const study: Study = this.studies.find(study => study.getName() === studyName);

            if (!study) {
                return;
            }

            const assayName: string = path.basename(filePath).replace(".pep", "");
            const assay: ProteomicsAssay = study.getAssays().find(
                assay => assay.getName() === assayName
            ) as ProteomicsAssay;

            if (!assay) {
                return;
            }

            const dataReader: FileSystemAssayVisitor = new AssayFileSystemDataReader(path.dirname(filePath), this.db);
            await assay.accept(dataReader);
        });
    }

    private async fileDeleted(filePath: string) {
        // Delete the assay that was just removed.
        const studyName: string = path.basename(path.dirname(filePath));

        if (filePath.endsWith(".pep")) {
            this.pushAction(async() => {
                const study: Study = this.studies.find(study => study.getName() === studyName);

                if (!study) {
                    return;
                }

                const assayName: string = path.basename(filePath).replace(".pep", "");

                const assay: Assay = study.getAssays().find(assay => assay.getName() === assayName);
                if (assay) {
                    await study.removeAssay(assay);
                }
            });
        }
    }

    private async directoryDeleted(directoryPath: string) {
        const studyName: string = path.basename(directoryPath);
        const study: Study = this.studies.find(study => study.getName() === studyName);

        if (!study) {
            return;
        }

        this.removeStudy(study);
    }

    private getProjectStudyWatcher(): ChangeListener<Study> {
        return {
            onChange: (object: Study, field: string, oldValue: any, newValue: any) => {
                if (field === "delete-assay") {
                    // Reset the currently active assay if necessary.
                    const assay: Assay = oldValue;
                    if (!this.activeAssay || this.activeAssay.getId() === assay.getId()) {
                        this.resetActiveAssay();
                    }
                } else if (field === "add-assay") {
                    // Process the given assay
                    const assay: ProteomicsAssay = newValue;
                    this.processAssay(assay);
                }
            }
        };
    }

    public async processAssay(assay: ProteomicsAssay): Promise<void> {
        console.log("Process: " + assay.getName() + " with id " + assay.getId());
        const processedItem = this.getProcessingResults(assay);
        processedItem.errorStatus = undefined;
        processedItem.progress = 0;
        processedItem.countTable = undefined;
        processedItem.trust = undefined;
        processedItem.communicators = undefined;

        try {
            const assayProcessor = new AssayProcessor(this.db, this.projectPath + ProjectManager.DB_FILE_NAME, assay, {
                onProgressUpdate: (progress: number) => {
                    processedItem.progress = progress
                }
            });

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
            processedItem.errorStatus = err;
        }

        this.resetActiveAssay();
    }
}
