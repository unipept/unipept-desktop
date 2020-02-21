import Project from "./Project";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import Database, { Statement } from "better-sqlite3";
import * as fs from "fs";
import InvalidProjectException from "@/logic/filesystem/project/InvalidProjectException";
import * as path from "path";
import uuidv4 from "uuid/v4";
import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";
// @ts-ignore
import schema_v1 from "raw-loader!@/db/schemas/schema_v1.sql";
import StudyFileSystemReader from "@/logic/filesystem/study/StudyFileSystemReader";
import StudyFileSystemWriter from "@/logic/filesystem/study/StudyFileSystemWriter";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";

export default class ProjectManager  {
    public readonly DB_FILE_NAME: string = "metadata.sqlite";

    /**
     * @param projectLocation The main directory of the project on disk.
     * @throws {IOException} Thrown whenever something goes wrong while loading the main project file.
     * @throws {InvalidProjectException} When the given directory does not contain all required project files.
     */
    public async loadExistingProject(projectLocation: string): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        if (!fs.existsSync(projectLocation + this.DB_FILE_NAME)) {
            throw new InvalidProjectException("Project metadata file was not found!");
        }

        const db = new Database(projectLocation + this.DB_FILE_NAME, {
            verbose: (mess) => console.warn(mess)
        });
        const project: Project = new Project(projectLocation, db);

        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = fs.readdirSync(projectLocation, { withFileTypes: true })
            .filter(dirEntry => dirEntry.isDirectory())
            .map(dirEntry => dirEntry.name);

        const studies: Study[] = [];

        for (const directory of subDirectories) {
            studies.push(await this.loadStudy(`${projectLocation}${directory}`, project));
        }

        project.setStudies(studies);
        return project;
    }

    /**
     * Create a new project and correctly initialize all required files in the given directory.
     * @param projectLocation Path to root directory of project.
     */
    public async initializeProject(projectLocation: string): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const db = new Database(projectLocation + this.DB_FILE_NAME, {
            verbose: (mess) => console.warn(mess)
        });
        db.exec(schema_v1);

        return new Project(projectLocation, db);
    }

    private async loadStudy(directory: string, project: Project): Promise<Study> {
        if (!directory.endsWith("/")) {
            directory += "/";
        }

        const studyName: string = path.basename(directory);
        let study: Study;

        // Check if the given study name is present in the database. If not, add the study with a new ID.
        const row = project.db.prepare("SELECT * FROM studies WHERE `name`=?").get(studyName);
        if (row) {
            // Retrieve study-id.
            study = new Study(new FileSystemStudyChangeListener(project), row.id, studyName);
        } else {
            study = new Study(new FileSystemStudyChangeListener(project), uuidv4(), studyName);
            // Store study in database
            const studyWriter: StudyVisitor = new StudyFileSystemWriter(directory, project);
            await study.accept(studyWriter);
        }

        const studyReader: StudyVisitor = new StudyFileSystemReader(directory, project);
        await study.accept(studyReader);

        return study;
    }
}
