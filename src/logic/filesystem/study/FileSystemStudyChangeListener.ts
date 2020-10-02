import * as fs from "fs";
import { store } from "./../../../main";
import StudyFileSystemMetaDataWriter from "@/logic/filesystem/study/StudyFileSystemMetaDataWriter";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import { ChangeListener, Study, Assay, ProteomicsAssay  } from "unipept-web-components";

export default class FileSystemStudyChangeListener implements ChangeListener<Study> {
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
            `${store.getters.projectLocation}${oldName}`,
            `${store.getters.projectLocation}${newName}`
        );

        // Also write this information to the database...
        const studyWriter: FileSystemStudyVisitor = new StudyFileSystemMetaDataWriter(
            `${store.getters.projectLocation}${newName}`,
            store.getters.database
        );

        await study.accept(studyWriter);
    }

    private async removeAssay(study: Study, assay: Assay): Promise<void> {
        const assayRemover: FileSystemAssayVisitor = new AssayFileSystemDestroyer(
            `${store.getters.projectLocation}${study.getName()}`,
            store.getters.database,
            store.getters.databaseFile
        );

        await assay.accept(assayRemover);
    }

    private async createAssay(study: Study, assay: Assay): Promise<void> {
        const path: string = `${store.getters.projectLocation}${study.getName()}/`;
        const metaDataWriter: FileSystemAssayVisitor = new AssayFileSystemMetaDataWriter(
            path,
            store.getters.database,
            study
        );
        const dataWriter: FileSystemAssayVisitor = new AssayFileSystemDataWriter(path, store.getters.database);

        await assay.accept(metaDataWriter);
        await assay.accept(dataWriter);

        // TODO
        // await this.project.processAssay(assay as ProteomicsAssay);
    }
}
