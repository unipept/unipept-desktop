import Project from "./../project/Project";
import ChangeListener from "unipept-web-components/src/logic/data-management/ChangeListener";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import mkdirp from "mkdirp";
import * as fs from "fs";
import StudyFileSystemWriter from "./../study/StudyFileSystemWriter";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import AssayFileSystemMetaDataWriter from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";

export default class FileSystemStudyChangeListener implements ChangeListener<Study> {
    private readonly project: Project;

    constructor(project: Project) {
        this.project = project;
    }

    public onChange(object: Study, field: string, oldValue: any, newValue: any) {
        if (field == "name") {
            this.project.pushAction(async() => await this.renameStudyFile(oldValue, newValue));
        } else if (field == "id") {
            this.project.pushAction(async() => await this.serializeStudy(object));
        } else if (field == "delete-assay") {
            this.project.pushAction(async() => await this.removeAssay(object, oldValue));
        } else if (field == "add-assay") {
            this.project.pushAction(async() => await this.createAssay(object, newValue));
        }
    }

    private async renameStudyFile(oldName: string, newName: string): Promise<void> {
        if (!oldName) {
            return;
        }

        await mkdirp(this.project.projectPath + newName);
        fs.renameSync(
            `${this.project.projectPath}${oldName}`,
            `${this.project.projectPath}${newName}`
        );
    }

    private async serializeStudy(study: Study): Promise<void> {
        const studyWriter: StudyVisitor = new StudyFileSystemWriter(
            `${this.project.projectPath}${study.getName()}`
        );
        await study.accept(studyWriter);
    }

    private async removeAssay(study: Study, assay: Assay): Promise<void> {
        const assayRemover: AssayVisitor = new AssayFileSystemDestroyer(
            `${this.project.projectPath}${study.getName()}`
        );
        await assay.accept(assayRemover);
    }

    private async createAssay(study: Study, assay: Assay): Promise<void> {
        const path: string = `${this.project.projectPath}${study.getName()}/`;
        const metaDataWriter: AssayVisitor = new AssayFileSystemMetaDataWriter(path);
        await assay.accept(metaDataWriter);
        const dataWriter: AssayVisitor = new AssayFileSystemDataWriter(path);
        await assay.accept(dataWriter);
    }
}
