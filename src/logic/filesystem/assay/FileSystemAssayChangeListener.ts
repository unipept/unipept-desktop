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
    private readonly project: Project;
    private readonly study: Study;

    constructor(project: Project, study: Study) {
        this.project = project;
        this.study = study;
    }

    public onChange(object: ProteomicsAssay, field: string, oldValue: any, newValue: any) {
        if (["date"].indexOf(field) !== -1) {
            // Only update metadata in this case
            this.serializeMetaData(object);
        } else if (field == "name") {
            // Rename the study file
            this.renameAssay(object, oldValue, newValue);
        } else if (field == "peptides") {
            let equalPeptides: boolean = oldValue && oldValue.length === newValue.length;

            if (equalPeptides) {
                // Now check if all corresponding values are equal.
                for (let i = 0; i < oldValue.length; i++) {
                    if (oldValue[i] !== newValue[i]) {
                        equalPeptides = false;
                        break;
                    }
                }
            }

            if (!equalPeptides) {
                // Only update the data field in this case
                this.serializeData(object);
            }
        }
    }

    private renameAssay(assay: ProteomicsAssay, oldName: string, newName: string): void {
        const mdWriter: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(
            this.getAssayDirectory(),
            this.project.db,
            this.study
        );
        this.project.pushAction(async() => {
            if (!oldName || oldName === newName) {
                return;
            }

            await mkdirp(`${this.getAssayDirectory()}`);
            // Rename metadata file
            fs.renameSync(
                `${this.getAssayDirectory()}${oldName}.pep`,
                `${this.getAssayDirectory()}${newName}.pep`
            );

            // Also update database values
            await assay.accept(mdWriter);
        });
    }

    private serializeMetaData(assay: ProteomicsAssay): void {
        const writer: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(
            this.getAssayDirectory(),
            this.project.db,
            this.study
        );
        this.project.pushAction(
            async() => await assay.accept(writer)
        );
    }

    private serializeData(assay: ProteomicsAssay): void {
        const writer: FileSystemAssayVisitor = new AssayFileSystemDataWriter(this.getAssayDirectory(), this.project.db);
        this.project.pushAction(
            async() => {
                await assay.accept(writer);
                // noinspection ES6MissingAwait
                this.project.processAssay(assay)
            }
        );
    }

    private getAssayDirectory(): string {
        return `${this.project.projectPath}${this.study.getName()}/`;
    }
}
