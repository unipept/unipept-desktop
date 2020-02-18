import Study from "unipept-web-components/src/logic/data-management/study/Study";
// import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";
import StudyFileSystemWriter from "./../study/StudyFileSystemWriter";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";
import uuidv4 from "uuid/v4";

export default class Project {
    public readonly studies: Study[] = [];
    public readonly projectPath: string;
    
    private unknownCounter: number = 0;

    // This queue keeps track of all actions that need to be performed. These actions may throw errors, and in the
    // event that an Error is thrown, the ErrorListener's of this class are informed and file synchronization stops
    // immediately.
    private readonly actionQueue: (() => Promise<void>)[] = [];
    private readonly syncInterval: number;

    constructor(path: string, syncInterval: number = 250) {
        this.projectPath = path;
        if (!this.projectPath.endsWith("/")) {
            this.projectPath += "/"
        }

        this.syncInterval = syncInterval;
    }

    public setStudies(studies: Study[]) {
        this.studies.splice(0, this.studies.length);
        this.studies.push(...studies);
    }

    public getStudies(): Study[] {
        return this.studies;
    }

    public createStudy(name: string): Study {
        const study: Study = new Study(new FileSystemStudyChangeListener(this), uuidv4(), name);
        this.pushAction(async() => {
            const studyWriter: StudyVisitor = new StudyFileSystemWriter(this.projectPath);
            await studyWriter.visitStudy(study);
        });
        this.studies.push(study);
        return study;
    }

    public removeStudy(study: Study): void {
        // Remove study from disk.

    }

    public async initialize() {
        // const watcher = chokidar.watch(this.projectPath);

        // watcher
        //     .on("add", this.fileAdded)
        //     .on("change", this.fileChanged)
        //     .on("unlink", this.fileDeleted);

        this.flushQueue();
    }

    public pushAction(action: () => Promise<void>) {
        this.actionQueue.push(action);
    }

    
    /**
     * Flushes the action queue at specific times, making sure that all operations are performed in order by waiting
     * for each operation to succesfully succeed.
     */
    private async flushQueue() {
        while (this.actionQueue.length > 0) {
            const action: () => Promise<void> = this.actionQueue.shift();
            await action();
        }

        setTimeout(async() => this.flushQueue(), this.syncInterval);
    }


    // private async fileAdded(filePath: string) {
    //     // Create new study or assay based on path.
        
    //     // Only if the given path is not a directory, we should act and check if we need to add a new study or assay to
    //     // existing study.
    //     if (!this.isDirectory(filePath)) {
    //         const studyName: string = path.dirname(filePath).split(path.sep).pop();
    //         const fileName: string = path.basename(filePath);

    //         if (fileName === "study.json") {
    //             // Add a new study containing all the assays in this folder.
    //             const study: Study = new Study();
    //             const studyReader: StudyVisitor = new StudyFileSystemReader(filePath);

    //             studyReader.visitStudy(study);
                
    //             fs.readdirSync
    //             this.studies.push(study);
    //         } else if (fileName.endsWith(".assay.json")) {
    //             // This is an assay file.
    //             // Check if there's already a study associated with this assay (otherwise, just ignore the assay, it
    //             // will get parsed once the study becomes available).
                
    //             const study: Study = this.studyMap.get(studyName);
                
    //             if (study) {
    //                 const assayName: string = fileName.replace(".assay.json", "");
    //                 // Make sure that this assay hasn't been imported already.
    //                 if (!study.getAssays().find(val => val.getName() === assayName)) {
    //                     const assayReader: AssayVisitor = new AssayFileSystemReader(filePath);
    //                     const assay = new MetaProteomicsAssay();
    //                     assayReader.visitMetaProteomicsAssay(assay);
    //                     study.addAssay(assay);
    //                 }
    //             }
    //         }
    //     }
    // }

    // private async fileChanged(filePath: string) {
    //     // Reload study or assay if required. The name of the item did not change, instead it's contents changed and
    //     // we should parse the contents again.
    // }

    // private async fileDeleted(filePath: string) {

    // }

    // private async isDirectory(filePath: string): Promise<boolean> {
    //     const stat = fs.lstatSync(filePath);
    //     return stat.isDirectory();
    // }
}
