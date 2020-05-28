import Project from "@/logic/filesystem/project/Project";
import mkdirp from "mkdirp";
import * as fs from "fs";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import ChangeListener from "unipept-web-components/src/business/entities/ChangeListener";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import Study from "unipept-web-components/src/business/entities/study/Study";

export default class FileSystemAssayChangeListener implements ChangeListener<ProteomicsAssay> {
    constructor(
        private readonly project: Project,
        private readonly study: Study
    ) {
        this.project = project;
        this.study = study;
    }

    public async onChange(object: ProteomicsAssay, field: string, oldValue: any, newValue: any): Promise<void> {
        if (["date", "searchConfiguration"].indexOf(field) !== -1) {
            // Only update metadata in this case
            await this.serializeMetaData(object);
        } else if (field == "name") {
            // Rename the assay file
            await this.renameAssay(object, oldValue, newValue);
        } else if (field == "peptides") {
            // Only update the data field in this case
            await this.serializeData(object);
        }
    }

    private async renameAssay(assay: ProteomicsAssay, oldName: string, newName: string): Promise<void> {
        const mdWriter: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(
            this.getAssayDirectory(),
            this.project.db,
            this.study
        );

        await mkdirp(`${this.getAssayDirectory()}`);
        console.log("Renaming file to: " + `${this.getAssayDirectory()}${newName}.pep`);
        // Rename metadata file
        fs.renameSync(
            `${this.getAssayDirectory()}${oldName}.pep`,
            `${this.getAssayDirectory()}${newName}.pep`
        );

        // Also update database values
        await assay.accept(mdWriter);
    }

    private async serializeMetaData(assay: ProteomicsAssay): Promise<void> {
        const writer: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(
            this.getAssayDirectory(),
            this.project.db,
            this.study
        );

        await assay.accept(writer);
    }

    private async serializeData(assay: ProteomicsAssay): Promise<void> {
        const writer: FileSystemAssayVisitor = new AssayFileSystemDataWriter(this.getAssayDirectory(), this.project.db);

        await assay.accept(writer);

        // noinspection ES6MissingAwait
        this.project.processAssay(assay);
    }

    private getAssayDirectory(): string {
        return `${this.project.projectPath}${this.study.getName()}/`;
    }
}
