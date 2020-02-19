import Project from "./../project/Project";
import ChangeListener from "unipept-web-components/src/logic/data-management/ChangeListener";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import mkdirp from "mkdirp";
import * as fs from "fs";
import StudyFileSystemWriter from "./../study/StudyFileSystemWriter";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";

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
        const studyWriter: StudyVisitor = new StudyFileSystemWriter(`${this.project.projectPath}${study.getName()}`);
        study.accept(studyWriter);
    }
}
