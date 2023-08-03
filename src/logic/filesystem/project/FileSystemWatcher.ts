import chokidar from "chokidar";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { store } from "./../../../main";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";
import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import StudyFileSystemDataWriter from "@/logic/filesystem/study/StudyFileSystemDataWriter";
import { Study, ProteomicsAssay, Assay } from "unipept-web-components";
import ErrorListener from "../ErrorListener";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import StudyFileSystemDataReader from "@/logic/filesystem/study/StudyFileSystemDataReader";
import StudyFileSystemRemover from "@/logic/filesystem/study/StudyFileSystemRemover";

/**
 * The FileSystemWatcher is responsible for the synchronization of a project with the disk. It watches the filesystem
 * for changes and updates the project if necessary.
 *
 * @author Pieter Verschaffelt
 */
export default class FileSystemWatcher {
    private readonly errorListeners: ErrorListener[] = [];
    // private watcher: chokidar.FSWatcher;

    constructor() {
        // this.watcher = chokidar.watch(store.getters.projectLocation, {
        //     ignoreInitial: true,
        //     // Ignore hidden files and metadata changes
        //     ignored: /^\..*$|metadata.sqlite|\.buffers/,
        //     awaitWriteFinish: {
        //         stabilityThreshold: 1000,
        //         pollInterval: 100
        //     }
        // });
        //
        // this.watcher
        //     .on("add", (path: string) => this.fileAdded(path))
        //     .on("change", (path: string) => this.fileChanged(path))
        //     .on("unlink", (path: string) => this.fileDeleted(path))
        //     .on("addDir", (path: string) => this.directoryAdded(path))
        //     .on("unlinkDir", (path: string) => this.directoryDeleted(path));
    }

    public async closeWatcher() {
        // if (this.watcher) {
        //     this.watcher.removeAllListeners();
        //     this.watcher.close();
        // }
    }

    public addErrorListener(listener: ErrorListener) {
        this.errorListeners.push(listener);
    }

    /**
     * This function must be invoked whenever a file was added to the local file system.
     * @param filePath
     */
    private async fileAdded(filePath: string) {
        // try {
        //     if (filePath.endsWith(".pep")) {
        //         const studyName: string = path.basename(path.dirname(filePath));
        //
        //         // Does the associated study already exist?
        //         const study: Study = store.getters.studies.find((study: Study) => study.getName() === studyName);
        //
        //         if (!study) {
        //             // possible new assays will be created by "directoryAdded" when creating a new study.
        //             return;
        //         }
        //
        //         const assayName: string = path.basename(filePath).replace(".pep", "");
        //
        //         // Check if an assay with this name already exists.
        //         if (study.getAssays().find(assay => assay.getName() === assayName)) {
        //             // Assay already exists and does not need to be added.
        //             return;
        //         }
        //
        //         // Add a new MetaProteomicsAssay to it's corresponding study if it does not exist already.
        //         const assay: ProteomicsAssay = new ProteomicsAssay(
        //             uuidv4()
        //         );
        //         assay.setName(assayName);
        //
        //         // Read metadata from disk if it exists.
        //         const assayMetaReader = new AssayFileSystemMetaDataReader(
        //             store.getters.projectLocation + studyName,
        //             store.getters.dbManager,
        //             store.getters.projectLocation,
        //             study
        //         );
        //         await assay.accept(assayMetaReader);
        //
        //         // Read peptides from disk for this assay
        //         const assayReader: FileSystemAssayVisitor = new AssayFileSystemDataReader(
        //             store.getters.projectLocation + studyName,
        //             store.getters.dbManager
        //         );
        //
        //         await assay.accept(assayReader);
        //
        //         // Write metadata for this assay to disk
        //         const assayWriter = new AssayFileSystemMetaDataWriter(
        //             store.getters.projectPath + studyName,
        //             store.getters.dbManager,
        //             study
        //         );
        //
        //         await assay.accept(assayWriter);
        //         // This study should already have a change listener, which takes care of processing the assay as soon as
        //         // it is added to the study.
        //         study.addAssay(assay);
        //         await store.dispatch("addAssay", assay);
        //         store.dispatch("analyseAssay", assay);
        //     }
        // } catch (err) {
        //     this.reportError(err);
        // }
    }

    private async directoryAdded(directoryPath: string) {
        // try {
        //     if (!directoryPath.endsWith("/")) {
        //         directoryPath += "/";
        //     }
        //
        //     const studyName: string = path.basename(directoryPath);
        //
        //     if (store.getters.studies.find((study: Study) => study.getName() === studyName)) {
        //         // Study exists already, nothing needs to be done.
        //         return;
        //     }
        //
        //     const study: Study = new Study(uuidv4());
        //     study.setName(studyName);
        //
        //     const studyWriter: FileSystemStudyVisitor = new StudyFileSystemDataWriter(
        //         directoryPath,
        //         store.getters.dbManager
        //     );
        //     await study.accept(studyWriter);
        //
        //     // This reader directly reads all assays associated with this study from disk.
        //     const studyReader = new StudyFileSystemDataReader(
        //         directoryPath,
        //         store.getters.dbManager,
        //         store.getters.projectLocation
        //     );
        //     await study.accept(studyReader);
        //
        //     await store.dispatch("addStudy", study);
        //
        //     // Now we should launch the processing for every assay of this study.
        //     for (const assay of study.getAssays()) {
        //         await store.dispatch("addAssay", assay);
        //         // noinspection ES6MissingAwait
        //         store.dispatch(
        //             "analyseAssay",
        //             assay
        //         );
        //     }
        //
        //     study.addChangeListener(new FileSystemStudyChangeListener());
        // } catch (err) {
        //     this.reportError(err);
        // }
    }

    private async fileChanged(filePath: string) {
        // try {
        //     const studyName: string = path.basename(path.dirname(filePath));
        //
        //     const study: Study = store.getters.studies.find((study: Study) => study.getName() === studyName);
        //
        //     if (!study) {
        //         return;
        //     }
        //
        //     const assayName: string = path.basename(filePath).replace(".pep", "");
        //     const assay: ProteomicsAssay = study.getAssays().find(
        //         assay => assay.getName() === assayName
        //     ) as ProteomicsAssay;
        //
        //     if (!assay) {
        //         return;
        //     }
        //
        //     const dataReader: FileSystemAssayVisitor = new AssayFileSystemDataReader(
        //         path.dirname(filePath),
        //         store.getters.dbManager
        //     );
        //
        //     // This assay's change listener should be active at this point and should reprocess automatically.
        //     await assay.accept(dataReader);
        // } catch (err) {
        //     this.reportError(err);
        // }
    }

    private async fileDeleted(filePath: string) {
        // try {
        //     // Delete the assay that was just removed from disk.
        //     const studyName: string = path.basename(path.dirname(filePath));
        //
        //     if (filePath.endsWith(".pep")) {
        //         const study: Study = store.getters.studies.find((study: Study) => study.getName() === studyName);
        //
        //         if (!study) {
        //             return;
        //         }
        //
        //         const assayName: string = path.basename(filePath).replace(".pep", "");
        //
        //         const assay: Assay = study.getAssays().find(assay => assay.getName() === assayName);
        //         if (assay) {
        //             await study.removeAssay(assay);
        //             const assayDestroyer = new AssayFileSystemDestroyer(
        //                 store.getters.projectLocation + studyName,
        //                 store.getters.dbManager
        //             );
        //
        //             await assay.accept(assayDestroyer);
        //             store.dispatch("removeAssay", assay);
        //             store.dispatch("resetActiveAssay");
        //         }
        //     }
        // } catch (err) {
        //     this.reportError(err);
        // }
    }

    private async directoryDeleted(directoryPath: string) {
        // try {
        //     const studyName: string = path.basename(directoryPath);
        //     const studyIdx: number = store.getters.studies.findIndex((study: Study) => study.getName() === studyName);
        //
        //     if (studyIdx === -1) {
        //         return;
        //     }
        //
        //     const study = store.getters.studies[studyIdx];
        //
        //     const assayDestroyer = new AssayFileSystemDestroyer(
        //         store.getters.projectLocation + studyName,
        //         store.getters.dbManager
        //     );
        //
        //     for (const assay of study.getAssays()) {
        //         await assay.accept(assayDestroyer);
        //     }
        //
        //     const studyDestroyer = new StudyFileSystemRemover(
        //         store.getters.projectLocation + studyName,
        //         store.getters.dbManager
        //     );
        //
        //     await study.accept(studyDestroyer);
        //
        //     await store.dispatch("removeStudy", study);
        //     store.dispatch("resetActiveAssay");
        // } catch (err) {
        //     this.reportError(err);
        // }
    }

    private reportError(error: Error): void {
        for (const listener of this.errorListeners) {
            listener.handleError(error);
        }
    }
}
