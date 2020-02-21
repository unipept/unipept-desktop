import Study from "unipept-web-components/src/logic/data-management/study/Study";
import chokidar from "chokidar";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";
import StudyFileSystemWriter from "./../study/StudyFileSystemWriter";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";
import uuidv4 from "uuid/v4";
import ErrorListener from "@/logic/filesystem/ErrorListener";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import FileSystemAssayChangeListener from "@/logic/filesystem/assay/FileSystemAssayChangeListener";
import StudyFileSystemRemover from "@/logic/filesystem/study/StudyFileSystemRemover";
import { FileEventType } from "@/logic/filesystem/project/FileEventType";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import * as path from "path";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";
import { Database } from "better-sqlite3";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import StudyFileSystemReader from "@/logic/filesystem/study/StudyFileSystemReader";
import ChangeListener from "unipept-web-components/src/logic/data-management/ChangeListener";
import MpaAnalysisManager from "unipept-web-components/src/logic/data-management/MpaAnalysisManager";

export default class Project {
    public readonly studies: Study[] = [];
    public readonly projectPath: string;
    public readonly db: Database;

    // The assay that's currently selected by the user as the active one. Will be null if no assay is currently active.
    public activeAssay: Assay = null;

    // This queue keeps track of all actions that need to be performed. These actions may throw errors, and in the
    // event that an Error is thrown, the ErrorListener's of this class are informed and file synchronization stops
    // immediately.
    private readonly actionQueue: ([() => Promise<void>, () => Promise<FileEvent[]>])[] = [];
    private readonly syncInterval: number;

    private errorListeners: ErrorListener[] = [];

    // Which file events are expected to happen after performing a specific operation? These events are used to keep
    // track of redundant file-system events that may happen and ignore them.
    private expectedFileEvents: Map<FileEventType, string[]>;
    private baseUrl: string;

    constructor(path: string, db: Database, baseUrl: string, syncInterval: number = 250) {
        this.db = db;
        this.projectPath = path;
        if (!this.projectPath.endsWith("/")) {
            this.projectPath += "/"
        }

        this.syncInterval = syncInterval;
        this.baseUrl = baseUrl;

        this.expectedFileEvents = new Map();
        for (const type of Object.values(FileEventType)) {
            this.expectedFileEvents.set(type as FileEventType, []);
        }
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
            .on("add",(path: string) => this.fileAdded(path))
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
            id? id: uuidv4(),
            name
        );
        const studyWriter: FileSystemStudyVisitor = new StudyFileSystemWriter(`${this.projectPath}${name}/`, this);
        this.pushAction(async() => {
            await studyWriter.visitStudy(study);
        }, async() => {
            return await studyWriter.getExpectedFileEvents(study);
        });
        this.studies.push(study);
        return study;
    }

    public createMetaProteomicsAssay(name: string, peptides: string[], study: Study): MetaProteomicsAssay {
        const assay: MetaProteomicsAssay = new MetaProteomicsAssay(
            [new FileSystemAssayChangeListener(this, study)],
            uuidv4(),
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
    }

    public pushAction(action: () => Promise<void>, expectedEvents: () => Promise<FileEvent[]> = async() => []) {
        this.actionQueue.push([action, expectedEvents]);
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
    
    /**
     * Flushes the action queue at specific times, making sure that all operations are performed in order by waiting
     * for each operation to successfully succeed.
     */
    private async flushQueue() {
        try {
            while (this.actionQueue.length > 0) {
                const item: [() => Promise<void>, () => Promise<FileEvent[]>] = this.actionQueue.shift();
                const action: () => Promise<void> = item[0];
                const events: () => Promise<FileEvent[]> = item[1];

                // First push the expected actions and then do execute the action
                for (const event of await events()) {
                    this.expectedFileEvents.get(event.eventType).push(event.path);
                }

                await action();
            }

            setTimeout(async() => this.flushQueue(), this.syncInterval);
        } catch (err) {
            console.error(err);
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
                if (current.progress == 1) {
                    newActive = current;
                    break;
                }
            }

            this.activateAssay(newActive);
        }
    }

    private shouldInterceptEvent(path: string, eventType: FileEventType): boolean {
        const idx: number = this.expectedFileEvents.get(eventType).indexOf(path);
        if (idx >= 0) {
            this.expectedFileEvents.get(eventType).splice(idx, 1);
            return true;
        }
        return false;
    }


    private async fileAdded(filePath: string) {
        if (this.shouldInterceptEvent(filePath, FileEventType.AddFile)) {
            return;
        }

        const studyName: string = path.basename(path.dirname(filePath));
        const study: Study = this.studies.find(study => study.getName() === studyName);

        if (!study) {
            return;
        }

        if (filePath.endsWith(".pep")) {
            // Add a new MetaProteomicsAssay to it's corresponding study
            const assayName: string = path.basename(filePath).replace(".pep", "");
            const assay: MetaProteomicsAssay = new MetaProteomicsAssay(
                [new FileSystemAssayChangeListener(this, study)],
                uuidv4(),
                undefined,
                assayName,
                new Date()
            );

            const assayReader: FileSystemAssayVisitor = new AssayFileSystemDataReader(
                this.projectPath + studyName,
                this.db
            );
            await assay.accept(assayReader);
            study.addAssay(assay);
        }
    }

    private async directoryAdded(directoryPath: string) {
        if (this.shouldInterceptEvent(directoryPath, FileEventType.AddDir)) {
            return;
        }

        const studyName: string = path.basename(directoryPath);
        const study: Study = new Study(
            [
                new FileSystemStudyChangeListener(this),
                this.getProjectStudyWatcher()
            ],
            uuidv4(),
            studyName
        );

        const studyReader: FileSystemStudyVisitor = new StudyFileSystemReader(directoryPath, this);
        await study.accept(studyReader);

        this.studies.push(study);
    }

    private async fileChanged(filePath: string) {
        if (this.shouldInterceptEvent(filePath, FileEventType.Change)) {
            console.log("Intercepted event " + filePath);
            return;
        }
        console.log("Changed: " + filePath);
    }

    private async fileDeleted(filePath: string) {
        if (this.shouldInterceptEvent(filePath, FileEventType.RemoveFile)) {
            return;
        }

        // Delete the assay that was just removed.
        const studyName: string = path.basename(path.dirname(filePath));
        const study: Study = this.studies.find(study => study.getName() === studyName);

        if (!study) {
            return;
        }

        if (filePath.endsWith(".pep")) {
            const assayName: string = path.basename(filePath).replace(".pep", "");
            const assay: Assay = study.getAssays().find(assay => assay.getName() === assayName);

            await study.removeAssay(assay);
        }
    }

    private async directoryDeleted(directoryPath: string) {
        if (this.shouldInterceptEvent(directoryPath, FileEventType.RemoveDir)) {
            return;
        }

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
                    const assay: MetaProteomicsAssay = newValue;
                    let mpaManager = new MpaAnalysisManager();

                    // TODO associate search settings per assay
                    mpaManager.processDataset(assay, { il: true, dupes: true, missed: false }, this.baseUrl)
                        .then(() => {
                            this.resetActiveAssay();
                        });
                }
            }
        };
    }
}
