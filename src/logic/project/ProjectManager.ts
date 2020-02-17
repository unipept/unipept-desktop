import Project from "./Project";
import { readdirSync } from "fs";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/visitors/StudyVisitor";
import StudyFileSystemReader from "unipept-web-components/src/logic/data-management/study/visitors/filesystem/StudyFileSystemReader";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import FileSystemStudy from "../filesystem/FileSystemStudy";
import { FileSystemStudyConsts } from "unipept-web-components/src/logic/data-management/study/visitors/filesystem/FileSystemStudyConsts";
import ErrorInformationPublisher from "@/logic/error/ErrorInformationPublisher";
import ErrorInformation from "@/logic/error/ErrorInformation";

export default class ProjectManager extends ErrorInformationPublisher {
    /**
     * @param projectLocation The main directory of the project on disk.
     * @throws {IOException} Thrown whenever something goes wrong while loading the main project file.
     */
    public async loadExistingProject(projectLocation: string): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const project: Project = new Project(projectLocation);
        const errors: ErrorInformation[] = [];
        
        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = readdirSync(projectLocation, { withFileTypes: true })
            .filter(dirEntry => dirEntry.isDirectory())
            .map(dirEntry => dirEntry.name);

        const studies: Study[] = [];

        for (const directory of subDirectories) {
            const studyReader: StudyVisitor = new StudyFileSystemReader(
                projectLocation + directory + "/" + FileSystemStudyConsts.STUDY_METADATA_FILE
            );

            try {
                const study: Study = new FileSystemStudy(project);
                await studyReader.visitStudy(study);
                studies.push(study);
            } catch (err) {
                errors.push(new ErrorInformation(
                    "Invalid study",
                    `Could not read study ${directory}. Make sure that this is a readable file that correctly represents a study.`)
                );
            }
        }

        project.setStudies(studies);
        await this.publishErrorInformation(errors);
        return project;
    }
}
