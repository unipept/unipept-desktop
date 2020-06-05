import Project from "./../project/Project";
import * as fs from "fs";
import StudyFileSystemMetaDataWriter from "@/logic/filesystem/study/StudyFileSystemMetaDataWriter";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import ChangeListener from "unipept-web-components/src/business/entities/ChangeListener";
import Study from "unipept-web-components/src/business/entities/study/Study";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";

export default class FileSystemStudyChangeListener implements ChangeListener<Study> {
    constructor(private readonly project: Project) {}

    public async onChange(object: Study, field: string, oldValue: any, newValue: any) {
        if (field === "name") {
            await this.renameStudyFile(object, oldValue, newValue);
        } else if (field === "delete-assay") {
            await this.removeAssay(object, oldValue);
        } else if (field === "add-assay") {
            await this.createAssay(object, newValue);
        }
    }

    private async renameStudyFile(study: Study, oldName: string, newName: string): Promise<void> {
        if (!oldName || oldName === newName) {
            return;
        }

        fs.renameSync(
            `${this.project.projectPath}${oldName}`,
            `${this.project.projectPath}${newName}`
        );

        // Also write this information to the database...
        const studyWriter: FileSystemStudyVisitor = new StudyFileSystemMetaDataWriter(
            `${this.project.projectPath}${newName}`,
            this.project.db
        );

        await study.accept(studyWriter);
    }

    private async removeAssay(study: Study, assay: Assay): Promise<void> {
        const assayRemover: FileSystemAssayVisitor = new AssayFileSystemDestroyer(
            `${this.project.projectPath}${study.getName()}`,
            this.project.db
        );

        await assay.accept(assayRemover);
    }

    private async createAssay(study: Study, assay: Assay): Promise<void> {
        const path: string = `${this.project.projectPath}${study.getName()}/`;
        const metaDataWriter: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(path, this.project.db, study);
        const dataWriter: FileSystemAssayVisitor = new AssayFileSystemDataWriter(path, this.project.db);

        await assay.accept(metaDataWriter);
        await assay.accept(dataWriter);

        await this.project.processAssay(assay as ProteomicsAssay);
    }
}
