import Study from "unipept-web-components/src/logic/data-management/study/Study";
import chokidar from "chokidar";
import fs from "fs";
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

export default class Project {
    public readonly studies: Study[] = [];
    public readonly projectPath: string;
    public readonly db: Database;

    private unknownCounter: number = 0;

    // This queue keeps track of all actions that need to be performed. These actions may throw errors, and in the
    // event that an Error is thrown, the ErrorListener's of this class are informed and file synchronization stops
    // immediately.
    private readonly actionQueue: ([() => Promise<void>, () => Promise<FileEvent[]>])[] = [];
    private readonly syncInterval: number;

    private studyByName: Map<string, Study> = new Map();

    private errorListeners: ErrorListener[] = [];

    private expectedFileEvents: Map<FileEventType, string[]>;

    constructor(path: string, db: Database, syncInterval: number = 250) {
        this.db = db;
        this.projectPath = path;
        if (!this.projectPath.endsWith("/")) {
            this.projectPath += "/"
        }

        this.syncInterval = syncInterval;

        this.expectedFileEvents = new Map();
        for (const type of Object.values(FileEventType)) {
            this.expectedFileEvents.set(type as FileEventType, []);
        }
    }

    public addErrorListener(listener: ErrorListener) {
        this.errorListeners.push(listener);
    }

    public setStudies(studies: Study[]) {
        this.studyByName.clear();
        for (const study of studies) {
            this.studyByName.set(study.getName(), study);
        }
        this.studies.splice(0, this.studies.length);
        this.studies.push(...studies);
    }

    public getStudies(): Study[] {
        return this.studies;
    }

    public createStudy(name: string): Study {
        const study: Study = new Study(new FileSystemStudyChangeListener(this), uuidv4(), name);
        const studyWriter: FileSystemStudyVisitor = new StudyFileSystemWriter(`${this.projectPath}${name}/`, this);
        this.pushAction(async() => {
            await studyWriter.visitStudy(study);
        }, async() => {
            return await studyWriter.getExpectedFileEvents(study);
        });
        this.studyByName.set(study.getName(), study);
        this.studies.push(study);
        return study;
    }

    public createMetaProteomicsAssay(name: string, peptides: string[], study: Study): MetaProteomicsAssay {
        const assay: MetaProteomicsAssay = new MetaProteomicsAssay(
            new FileSystemAssayChangeListener(this, study),
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
            this.studyByName.delete(study.getName());
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

    public initialize() {
        const watcher = chokidar.watch(this.projectPath, {
            ignoreInitial: true,
            // Ignore hidden files
            ignored: ".*",
            awaitWriteFinish: {
                stabilityThreshold: 2000,
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

    public pushAction(action: () => Promise<void>, expectedEvents: () => Promise<FileEvent[]> = async() => []) {
        this.actionQueue.push([action, expectedEvents]);
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


    }

    private async directoryAdded(directoryPath: string) {
        if (this.shouldInterceptEvent(directoryPath, FileEventType.AddDir)) {
            console.log("Intercepted event " + directoryPath);
            return;
        }
        console.log("Added dir: " + directoryPath);
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
            console.log("Intercepted event " + filePath);
            return;
        }
        console.log("Deleted: " + filePath);
    }

    private async directoryDeleted(directoryPath: string) {
        if (this.shouldInterceptEvent(directoryPath, FileEventType.RemoveDir)) {
            console.log("Intercepted event " + directoryPath);
            return;
        }
        console.log("Deleted dir: " + directoryPath);
    }

    private async isDirectory(filePath: string): Promise<boolean> {
        const stat = fs.lstatSync(filePath);
        return stat.isDirectory();
    }
}
