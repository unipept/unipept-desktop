import { store } from "./../../../main";
import mkdirp from "mkdirp";
import * as fs from "fs";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import { ChangeListener, ProteomicsAssay, Study } from "unipept-web-components";

export default class FileSystemAssayChangeListener implements ChangeListener<ProteomicsAssay> {
    constructor(
        private readonly study: Study
    ) {
        this.study = study;
    }

    public async onChange(object: ProteomicsAssay, field: string, oldValue: any, newValue: any): Promise<void> {
        console.log("Update assay...");
        console.log("HUPLA...");
        if (["date", "searchConfiguration", "endpoint", "databaseVersion"].indexOf(field) !== -1) {
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
            store.getters.database,
            this.study
        );

        await mkdirp(`${this.getAssayDirectory()}`);

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
            store.getters.database,
            this.study
        );

        await assay.accept(writer);
    }

    private async serializeData(assay: ProteomicsAssay): Promise<void> {
        const writer: FileSystemAssayVisitor = new AssayFileSystemDataWriter(this.getAssayDirectory(), store.getters.database);

        await assay.accept(writer);

        // noinspection ES6MissingAwait
        store.dispatch("processAssay", assay);
    }

    private getAssayDirectory(): string {
        return `${store.getters.projectLocation}${this.study.getName()}/`;
    }
}
