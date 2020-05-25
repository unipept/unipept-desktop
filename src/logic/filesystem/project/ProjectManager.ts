import Project from "./Project";
import Database from "better-sqlite3";
import * as fs from "fs";
import InvalidProjectException from "@/logic/filesystem/project/InvalidProjectException";
import * as path from "path";
// @ts-ignore
import schema_v1 from "raw-loader!@/db/schemas/schema_v1.sql";
import StudyFileSystemReader from "@/logic/filesystem/study/StudyFileSystemReader";
import RecentProjectsManager from "@/logic/filesystem/project/RecentProjectsManager";
import Study from "unipept-web-components/src/business/entities/study/Study";
import IOException from "unipept-web-components/src/business/exceptions/IOException";

export default class ProjectManager  {
    public static readonly DB_FILE_NAME: string = "metadata.sqlite";

    /**
     * @param projectLocation The main directory of the project on disk.
     * @throws {IOException} Thrown whenever something goes wrong while loading the main project file.
     * @throws {InvalidProjectException} When the given directory does not contain all required project files.
     */
    public async loadExistingProject(projectLocation: string): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        if (!fs.existsSync(projectLocation + ProjectManager.DB_FILE_NAME)) {
            throw new InvalidProjectException("Project metadata file was not found!");
        }

        const db = new Database(projectLocation + ProjectManager.DB_FILE_NAME);
        db.pragma("journal_mode = WAL");
        const project: Project = new Project(projectLocation, db);

        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = fs.readdirSync(projectLocation, { withFileTypes: true })
            .filter(dirEntry => dirEntry.isDirectory())
            .map(dirEntry => dirEntry.name);

        for (const directory of subDirectories) {
            await this.loadStudy(`${projectLocation}${directory}`, project);
        }

        await this.addToRecentProjects(projectLocation);

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

        const db = new Database(projectLocation + ProjectManager.DB_FILE_NAME);
        db.pragma("journal_mode = WAL");
        db.exec(schema_v1);

        await this.addToRecentProjects(projectLocation);

        return new Project(projectLocation, db);
    }

    private async loadStudy(directory: string, project: Project): Promise<void> {
        if (!directory.endsWith("/")) {
            directory += "/";
        }

        const studyName: string = path.basename(directory);
        let study: Study;

        // Check if the given study name is present in the database. If not, add the study with a new ID.
        const row = project.db.prepare("SELECT * FROM studies WHERE `name`=?").get(studyName);
        if (row) {
            // Retrieve study-id.
            study = project.createStudy(studyName, row.id);
        } else {
            study = project.createStudy(studyName);
        }

        const studyReader = new StudyFileSystemReader(directory, project);
        await study.accept(studyReader);
    }

    private async addToRecentProjects(path: string) {
        const recentManager = new RecentProjectsManager();
        await recentManager.addRecentProject(path);
    }
}
