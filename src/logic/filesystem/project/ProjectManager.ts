import Project from "./Project";
import { readdirSync } from "fs";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";
import StudyFileSystemReader from "./../study/StudyFileSystemReader";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import { FileSystemStudyConsts } from "./../study/FileSystemStudyConsts";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import AssayFileSystemMetaDataReader from "@/logic/filesystem/assay/AssayFileSystemMetaDataReader";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import FileSystemAssayChangeListener from "@/logic/filesystem/assay/FileSystemAssayChangeListener";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";

export default class ProjectManager  {
    /**
     * @param projectLocation The main directory of the project on disk.
     * @throws {IOException} Thrown whenever something goes wrong while loading the main project file.
     */
    public async loadExistingProject(projectLocation: string): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const project: Project = new Project(projectLocation);

        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = readdirSync(projectLocation, { withFileTypes: true })
            .filter(dirEntry => dirEntry.isDirectory())
            .map(dirEntry => dirEntry.name);

        const studies: Study[] = [];

        for (const directory of subDirectories) {
            studies.push(await this.loadStudy(`${projectLocation}${directory}`, project));
        }

        project.setStudies(studies);
        return project;
    }

    private async loadStudy(directory: string, project: Project): Promise<Study> {
        if (!directory.endsWith("/")) {
            directory += "/";
        }

        // Check all files in the given directory and try to load the assays
        const files: string[] = readdirSync(directory, { withFileTypes: true })
            .filter(entry => !entry.isDirectory())
            .map(entry => entry.name)
            .filter(name => !name.startsWith(".") && name !== "study.json" && name.endsWith(".json"))
            .map(name => name.replace(".json", ""));

        const studyReader: StudyVisitor = new StudyFileSystemReader(directory);

        const study: Study = new Study(new FileSystemStudyChangeListener(project));
        await studyReader.visitStudy(study);

        const assays: MetaProteomicsAssay[] = [];
        for (const file of files) {
            console.log("Reading file " + file);
            const assay: MetaProteomicsAssay = new MetaProteomicsAssay(
                new FileSystemAssayChangeListener(project, study),
                undefined,
                undefined,
                file,
                undefined
            );

            const metaDataReader: AssayVisitor = new AssayFileSystemMetaDataReader(directory);
            await assay.accept(metaDataReader);
            const dataReader: AssayVisitor = new AssayFileSystemDataReader(directory);
            await assay.accept(dataReader);
            study.addAssay(assay);
        }

        return study;
    }
}
