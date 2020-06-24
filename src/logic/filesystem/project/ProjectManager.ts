import Project from "./Project";
import * as fs from "fs";
import InvalidProjectException from "@/logic/filesystem/project/InvalidProjectException";
import * as path from "path";
import { store } from "./../../../main";
// @ts-ignore
import schema_v1 from "raw-loader!@/db/schemas/schema_v1.sql";
import StudyFileSystemDataReader from "@/logic/filesystem/study/StudyFileSystemDataReader";
import RecentProjectsManager from "@/logic/filesystem/project/RecentProjectsManager";
import Study from "unipept-web-components/src/business/entities/study/Study";
import IOException from "unipept-web-components/src/business/exceptions/IOException";
import Database, { Database as DatabaseType } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import StudyFileSystemMetaDataWriter from "@/logic/filesystem/study/StudyFileSystemMetaDataWriter";
import FileSystemWatcher from "./FileSystemWatcher";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";
import FileSystemAssayChangeListener from "@/logic/filesystem/assay/FileSystemAssayChangeListener";


export default class ProjectManager  {
    public static readonly DB_FILE_NAME: string = "metadata.sqlite";

    /**
     * @param projectLocation The main directory of the project on disk.
     * @throws {IOException} Thrown whenever something goes wrong while loading the main project file.
     * @throws {InvalidProjectException} When the given directory does not contain all required project files.
     */
    public async loadExistingProject(projectLocation: string): Promise<void> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        if (!fs.existsSync(projectLocation + ProjectManager.DB_FILE_NAME)) {
            throw new InvalidProjectException("Project metadata file was not found!");
        }

        const db = new Database(projectLocation + ProjectManager.DB_FILE_NAME);

        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = fs.readdirSync(projectLocation, { withFileTypes: true })
            .filter(dirEntry => dirEntry.isDirectory())
            .map(dirEntry => dirEntry.name);

        const studies = [];

        for (const directory of subDirectories) {
            studies.push(await this.loadStudy(`${projectLocation}${directory}`, db));
        }

        await this.addToRecentProjects(projectLocation);

        await store.dispatch("initializeProject", [projectLocation, db, studies]);

        for (const study of studies) {
            for (const assay of study.getAssays()) {
                assay.addChangeListener(new FileSystemAssayChangeListener(study));
            }
            study.addChangeListener(new FileSystemStudyChangeListener());
        }
    }

    /**
     * Create a new project and correctly initialize all required files in the given directory.
     * @param projectLocation Path to root directory of project.
     */
    public async initializeProject(projectLocation: string): Promise<void> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const db = new Database(projectLocation + ProjectManager.DB_FILE_NAME);
        db.exec(schema_v1);

        await this.addToRecentProjects(projectLocation);

        await store.dispatch("initializeProject", [projectLocation, db, []]);
    }

    private async loadStudy(directory: string, db: DatabaseType): Promise<Study> {
        if (!directory.endsWith("/")) {
            directory += "/";
        }

        const studyName: string = path.basename(directory);
        let study: Study;

        // Check if the given study name is present in the database. If not, add the study with a new ID.
        const row = db.prepare("SELECT * FROM studies WHERE `name`=?").get(studyName);

        if (row) {
            study = new Study(row.id);
        } else {
            study = new Study(uuidv4())
        }

        study.setName(studyName);

        const studyWriter = new StudyFileSystemMetaDataWriter(directory, db);
        await study.accept(studyWriter);

        // Read all assays from this study
        const studyReader = new StudyFileSystemDataReader(directory, db);
        await study.accept(studyReader);

        return study;
    }

    private async addToRecentProjects(path: string) {
        const recentManager = new RecentProjectsManager();
        await recentManager.addRecentProject(path);
    }
}
