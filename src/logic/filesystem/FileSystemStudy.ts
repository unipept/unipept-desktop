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
            writer.visitStudy(this);
        });
    }

    public setName(name: string) {
        const oldName: string = this.name;
        this.name = name;
        this.project.pushAction(async() => {
            mkdirp(this.project.projectPath + name);
            fs.renameSync(this.project.projectPath + oldName, this.project.projectPath + name);
        });
    }
    
    public async createAssay(): Promise<Assay> {
        const assay: MetaProteomicsAssay = new MetaProteomicsAssay();
        // TODO remove and implement otherwise
        assay.setName("Unknown assay");
        this.assays.push(assay);
        this.project.pushAction(async() => {
            const writeVisitor: AssayVisitor = new AssayFileSystemWriter(this.project.projectPath + this.name);
            writeVisitor.visitMetaProteomicsAssay(assay);
        });
        return assay;
    }

    public async removeAssay(assay: Assay) {
        this.project.pushAction(async() => {
            const deleteVisitor: AssayVisitor = new AssayFileSystemDestroyer(this.project.projectPath + this.name);
        });
    }
}
