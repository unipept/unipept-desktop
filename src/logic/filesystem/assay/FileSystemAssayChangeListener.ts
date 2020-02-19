import ChangeListener from "unipept-web-components/src/logic/data-management/ChangeListener";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import Project from "@/logic/filesystem/project/Project";
import mkdirp from "mkdirp";
import * as fs from "fs";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import AssayFileSystemMetaDataWriter from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";

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
            this.project.pushAction(async() => await this.serializeMetaData(object));
        } else if (field == "name") {
            // Rename the study file
            this.project.pushAction(async() => await this.renameAssayFile(oldValue, newValue));
        } else if (field == "peptides") {
            // Only update the data field in this case
            this.project.pushAction(async() => await this.serializeData(object));
        }
    }

    private async renameAssayFile(oldName: string, newName: string): Promise<void> {
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
    }

    private async serializeMetaData(assay: MetaProteomicsAssay): Promise<void> {
        const writer: AssayVisitor = new AssayFileSystemMetaDataWriter(this.getAssayDirectory());
        await assay.accept(writer);
    }

    private async serializeData(assay: MetaProteomicsAssay): Promise<void> {
        const writer: AssayVisitor = new AssayFileSystemDataWriter(this.getAssayDirectory());
        await assay.accept(writer);
    }

    private getAssayDirectory(): string {
        return `${this.project.projectPath}${this.study.getName()}/`;
    }
}
