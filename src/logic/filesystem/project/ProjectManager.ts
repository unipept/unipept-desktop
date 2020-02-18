import Project from "./Project";
import { readdirSync } from "fs";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";
import StudyFileSystemReader from "./../study/StudyFileSystemReader";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import { FileSystemStudyConsts } from "./../study/FileSystemStudyConsts";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";

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
            const studyReader: StudyVisitor = new StudyFileSystemReader(
                projectLocation + directory + "/" + FileSystemStudyConsts.STUDY_METADATA_FILE
            );

            const study: Study = new Study(new FileSystemStudyChangeListener(project));
            await studyReader.visitStudy(study);
            studies.push(study);
        }

        project.setStudies(studies);
        return project;
    }
}
