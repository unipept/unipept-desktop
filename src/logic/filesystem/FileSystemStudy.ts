import Study from "unipept-web-components/src/logic/data-management/study/Study";
import Project from "../project/Project";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/visitors/AssayVisitor";
import AssayFileSystemWriter from "unipept-web-components/src/logic/data-management/assay/visitors/filesystem/AssayFileSystemWriter";
import AssayFileSystemDestroyer from "unipept-web-components/src/logic/data-management/assay/visitors/filesystem/AssayFileSystemDestroyer";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/visitors/StudyVisitor";
import StudyFileSystemWriter from "unipept-web-components/src/logic/data-management/study/visitors/filesystem/StudyFileSystemWriter";
import fs, { watch } from "fs";
import mkdirp from "mkdirp";
import { FileSystemStudyConsts } from "unipept-web-components/src/logic/data-management/study/visitors/filesystem/FileSystemStudyConsts";
import ErrorInformation from "@/logic/error/ErrorInformation";


/**
 * Special version of a Study that informs it's parent project about internal changes. This Study is also responsible
 * for creating new assays, and synchronizing them to disk.
 */
export default class FileSystemStudy extends Study {
    private readonly project: Project;

    constructor(project: Project, id?: string, name?: string) {
        super(id, name);
        this.project = project;
    }

    public setId(id: string) {
        this.id = id;
        this.project.pushAction(async() => {
            const writer: StudyVisitor = new StudyFileSystemWriter(
                this.project.projectPath + this.name + "/" + FileSystemStudyConsts.STUDY_METADATA_FILE
            );

            try {
                await writer.visitStudy(this);
            } catch (err) {
                return [
                    new ErrorInformation(
                        "Unwriteable study",
                        `Could not write study "${this.name}". Make sure that this file is readable.`
                    )
                ];
            }
            return [];
        });
    }

    public setName(name: string) {
        const oldName: string = this.name;
        this.name = name;
        if (oldName) {
            this.project.pushAction(async() => {
                try {
                    mkdirp(this.project.projectPath + name);
                    fs.renameSync(this.project.projectPath + oldName, this.project.projectPath + name);
                } catch (err) {
                    // Reset the name to the old name, because something went wrong during the rename-operation.
                    this.name = oldName;
                    return [
                        new ErrorInformation(
                            "Study not renamed",
                            `Cannot rename study "${oldName}" to "${name}".`
                        )
                    ]
                }
            });
        }
    }
    
    public async createAssay(): Promise<Assay> {
        const assay: MetaProteomicsAssay = new MetaProteomicsAssay();
        // TODO remove and implement otherwise
        assay.setName("Unknown assay");
        this.assays.push(assay);
        this.project.pushAction(async() => {
            try {
                const writeVisitor: AssayVisitor = new AssayFileSystemWriter(this.project.projectPath + this.name);
                // TODO get rid of cast here in the future.
                await writeVisitor.visitMetaProteomicsAssay(assay as MetaProteomicsAssay);
            } catch (err) {
                return [
                    new ErrorInformation(
                        "Can't write assay",
                        `Cannot write assay "${assay.getName()}" to disk.`
                    )
                ];
            }
            return [];
        });
        return assay;
    }

    public async removeAssay(assay: Assay) {
        this.project.pushAction(async() => {
            try {
                const deleteVisitor: AssayVisitor = new AssayFileSystemDestroyer(this.project.projectPath + this.name);
                // TODO get rid of cast here in the future.
                await deleteVisitor.visitMetaProteomicsAssay(assay as MetaProteomicsAssay);
            } catch (err) {
                return [
                    new ErrorInformation(
                        "Can't delete assay",
                        `Cannot delete assay "${assay.getName()}" from disk.`
                    )
                ];
            }
            return [];
        });
    }
}
