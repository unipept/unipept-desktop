import Project from "./Project";
import { readdirSync } from "fs";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/visitors/StudyVisitor";
import StudyFileSystemReader from "unipept-web-components/src/logic/data-management/study/visitors/filesystem/StudyFileSystemReader";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import FileSystemStudy from "../filesystem/FileSystemStudy";
import { FileSystemStudyConsts } from "unipept-web-components/src/logic/data-management/study/visitors/filesystem/FileSystemStudyConsts";

export default class ProjectManager {
    /**
     * 
     * @param projectLocation 
     * @throws {IOException}
     */
    public async loadExistingProject(projectLocation: string): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const project: Project = new Project(projectLocation);
        
        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = readdirSync(projectLocation, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const studies: Study[] = [];

        for (const directory of subDirectories) {
            const studyReader: StudyVisitor = new StudyFileSystemReader(
                projectLocation + directory + "/" + FileSystemStudyConsts.STUDY_METADATA_FILE
            );
            const study: Study = new FileSystemStudy(project);
            studyReader.visitStudy(study);
            studies.push(study);
        }

        project.setStudies(studies);
        return project;
    }
}
