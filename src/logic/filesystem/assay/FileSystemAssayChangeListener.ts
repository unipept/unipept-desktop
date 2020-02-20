import ChangeListener from "unipept-web-components/src/logic/data-management/ChangeListener";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import Project from "@/logic/filesystem/project/Project";
import mkdirp from "mkdirp";
import * as fs from "fs";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import AssayFileSystemMetaDataWriter from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import { FileEventType } from "@/logic/filesystem/project/FileEventType";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";

export default class FileSystemAssayChangeListener implements ChangeListener<MetaProteomicsAssay> {
    private readonly project: Project;
    private readonly study: Study;

    constructor(project: Project, study: Study) {
        this.project = project;
        this.study = study;
    }

    public onChange(object: MetaProteomicsAssay, field: string, oldValue: any, newValue: any) {
        if (["id", "date"].indexOf(field) !== -1) {
            // Only update metadata in this case
            this.serializeMetaData(object);
        } else if (field == "name") {
            // Rename the study file
            this.renameAssayFile(oldValue, newValue);
        } else if (field == "peptides") {
            // Only update the data field in this case
            this.serializeData(object);
        }
    }

    private renameAssayFile(oldName: string, newName: string): void {
        this.project.pushAction(async() => {
            if (!oldName) {
                return;
            }

            await mkdirp(`${this.getAssayDirectory()}`);
            // Rename metadata file
            fs.renameSync(
                `${this.getAssayDirectory()}${oldName}.json`,
                `${this.getAssayDirectory()}${newName}.json`
            );
            // Rename data file
            fs.renameSync(
                `${this.getAssayDirectory()}${oldName}.txt`,
                `${this.getAssayDirectory()}${newName}.txt`
            )
        }, async() => [
            new FileEvent(FileEventType.RemoveFile, `${this.getAssayDirectory()}${oldName}.json`),
            new FileEvent(FileEventType.AddFile, `${this.getAssayDirectory()}${newName}.json`),
            new FileEvent(FileEventType.RemoveFile, `${this.getAssayDirectory()}${oldName}.txt`),
            new FileEvent(FileEventType.AddFile, `${this.getAssayDirectory()}${newName}.txt`),
        ]);
    }

    private serializeMetaData(assay: MetaProteomicsAssay): void {
        const writer: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(this.getAssayDirectory());
        this.project.pushAction(
            async() => await assay.accept(writer),
            async() => await writer.getExpectedFileEvents(assay)
        );
    }

    private serializeData(assay: MetaProteomicsAssay): void {
        const writer: FileSystemAssayVisitor = new AssayFileSystemDataWriter(this.getAssayDirectory());
        this.project.pushAction(
            async() => await assay.accept(writer),
            async() => await writer.getExpectedFileEvents(assay)
        );
    }

    private getAssayDirectory(): string {
        return `${this.project.projectPath}${this.study.getName()}/`;
    }
}
