import Project from "./../project/Project";
import ChangeListener from "unipept-web-components/src/logic/data-management/ChangeListener";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import mkdirp from "mkdirp";
import * as fs from "fs";
import StudyFileSystemWriter from "./../study/StudyFileSystemWriter";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import AssayFileSystemMetaDataWriter from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import { FileEventType } from "@/logic/filesystem/project/FileEventType";
import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import {readdirSync} from "fs";

export default class FileSystemStudyChangeListener implements ChangeListener<Study> {
    private readonly project: Project;

    constructor(project: Project) {
        this.project = project;
    }

    public onChange(object: Study, field: string, oldValue: any, newValue: any) {
        if (field == "name") {
            this.renameStudyFile(oldValue, newValue);
        } else if (field == "id") {
            this.serializeStudy(object);
        } else if (field == "delete-assay") {
            this.removeAssay(object, oldValue);
        } else if (field == "add-assay") {
            this.createAssay(object, newValue);
        }
    }

    private renameStudyFile(oldName: string, newName: string): void {
        this.project.pushAction(async() => {
            if (!oldName) {
                return;
            }

            await mkdirp(this.project.projectPath + newName);
            fs.renameSync(
                `${this.project.projectPath}${oldName}`,
                `${this.project.projectPath}${newName}`
            );
        }, async() => {
            if (!oldName) {
                return [];
            }

            const events: FileEvent[] = [];
            for (const file of readdirSync(`${this.project.projectPath}${oldName}`, { withFileTypes: true })) {
                events.push(
                    new FileEvent(FileEventType.RemoveFile, `${this.project.projectPath}${oldName}/${file.name}`)
                );
                events.push(
                    new FileEvent(FileEventType.AddFile, `${this.project.projectPath}${newName}/${file.name}`)
                );
            }

            events.push(new FileEvent(FileEventType.RemoveDir, `${this.project.projectPath}${oldName}`));
            events.push(new FileEvent(FileEventType.AddDir, `${this.project.projectPath}${newName}`));

            return events;
        })
    }

    private serializeStudy(study: Study): void {
        const studyWriter: FileSystemStudyVisitor = new StudyFileSystemWriter(
            `${this.project.projectPath}${study.getName()}`
        );

        this.project.pushAction(async() => {
            await study.accept(studyWriter);
        }, async() => {
            return await studyWriter.getExpectedFileEvents(study)
        });
    }

    private removeAssay(study: Study, assay: Assay): void {
        const assayRemover: FileSystemAssayVisitor = new AssayFileSystemDestroyer(
            `${this.project.projectPath}${study.getName()}`
        );

        this.project.pushAction(async() => {
            await assay.accept(assayRemover);
        }, async() => {
            return await assayRemover.getExpectedFileEvents(assay);
        })
    }

    private createAssay(study: Study, assay: Assay): void {
        const path: string = `${this.project.projectPath}${study.getName()}/`;
        const metaDataWriter: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(path);
        const dataWriter: FileSystemAssayVisitor = new AssayFileSystemDataWriter(path);

        this.project.pushAction(async() => {
            await assay.accept(metaDataWriter);
            await assay.accept(dataWriter);
        }, async() => {
            return [
                ...await metaDataWriter.getExpectedFileEvents(assay),
                ...await dataWriter.getExpectedFileEvents(assay)
            ]
        })
    }
}
