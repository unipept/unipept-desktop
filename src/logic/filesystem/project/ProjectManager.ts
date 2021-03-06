import * as fs from "fs";
import InvalidProjectException from "@/logic/filesystem/project/InvalidProjectException";
import * as path from "path";
import { store } from "./../../../main";
// @ts-ignore
import StudyFileSystemDataReader from "@/logic/filesystem/study/StudyFileSystemDataReader";
import RecentProjectsManager from "@/logic/filesystem/project/RecentProjectsManager";
import { Study, IOException } from "unipept-web-components";
import { Database as DatabaseType } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import StudyFileSystemMetaDataWriter from "@/logic/filesystem/study/StudyFileSystemMetaDataWriter";
import FileSystemStudyChangeListener from "@/logic/filesystem/study/FileSystemStudyChangeListener";
import FileSystemAssayChangeListener from "@/logic/filesystem/assay/FileSystemAssayChangeListener";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import Utils from "@/logic/Utils";
import ProjectVersionMismatchException from "@/logic/exception/ProjectVersionMismatchException";

const electron = require("electron");
const app = electron.remote.app;

export default class ProjectManager  {
    public static readonly DB_FILE_NAME: string = "metadata.sqlite";
    // Reading and writing large assays to and from the database can easily take longer than 5 seconds, causing
    // a "SQLBusyException" to b§e thrown. By increasing the timeout to a value, larger than the time it should take
    // to execute these transactions, these errors can be avoided.
    public static readonly DB_TIMEOUT: number = 15000;

    /**
     * @param projectLocation The main directory of the project on disk.
     * @param addToRecents Should this project be added to the list of recent projects? Set to false for no.
     * @throws {IOException} Thrown whenever something goes wrong while loading the main project file.
     * @throws {InvalidProjectException} When the given directory does not contain all required project files.
     * @throws {ProjectVersionMismatchException}
     */
    public async loadExistingProject(projectLocation: string, addToRecents: boolean = true): Promise<void> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        if (!fs.existsSync(projectLocation + ProjectManager.DB_FILE_NAME)) {
            throw new InvalidProjectException("Project metadata file was not found!");
        }

        const dbManager = new DatabaseManager(projectLocation + ProjectManager.DB_FILE_NAME);
        const dbAppVersion = dbManager.getApplicationVersion();

        if (Utils.isVersionLargerThan(dbAppVersion, app.getVersion())) {
            throw new ProjectVersionMismatchException();
        } else {
            await dbManager.setApplicationVersion(app.getVersion());
        }

        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = fs.readdirSync(projectLocation, { withFileTypes: true })
            .filter(dirEntry => dirEntry.isDirectory() && dirEntry.name !== ".buffers")
            .map(dirEntry => dirEntry.name);

        const studies = [];

        for (const directory of subDirectories) {
            studies.push(await this.loadStudy(`${projectLocation}${directory}`, dbManager));
        }

        if (addToRecents) {
            await this.addToRecentProjects(projectLocation);
        }

        await store.dispatch("initializeProject", [projectLocation, dbManager, studies]);

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
     * @param addToRecents Should this project be added to the list of recent projects? Set to false for no.
     */
    public async initializeProject(projectLocation: string, addToRecents: boolean = true): Promise<void> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const dbManager = this.setUpDatabase(projectLocation);

        if (addToRecents) {
            await this.addToRecentProjects(projectLocation);
        }

        await store.dispatch("initializeProject", [projectLocation, dbManager, []]);
    }

    public setUpDatabase(projectLocation: string): DatabaseManager {
        return new DatabaseManager(projectLocation + ProjectManager.DB_FILE_NAME);
    }

    private async loadStudy(directory: string, dbManager: DatabaseManager): Promise<Study> {
        if (!directory.endsWith("/")) {
            directory += "/";
        }

        const studyName: string = path.basename(directory);
        let study: Study;

        // Check if the given study name is present in the database. If not, add the study with a new ID.
        const row = await dbManager.performQuery<any>((db: DatabaseType) => {
            return db.prepare("SELECT * FROM studies WHERE `name`=?").get(studyName);
        })

        if (row) {
            study = new Study(row.id);
        } else {
            study = new Study(uuidv4())
        }

        study.setName(studyName);

        const studyWriter = new StudyFileSystemMetaDataWriter(directory, dbManager);
        await study.accept(studyWriter);

        // Read all assays from this study
        const studyReader = new StudyFileSystemDataReader(directory, dbManager);
        await study.accept(studyReader);

        return study;
    }

    private async addToRecentProjects(path: string) {
        const recentManager = new RecentProjectsManager();
        await recentManager.addRecentProject(path);
    }
}
