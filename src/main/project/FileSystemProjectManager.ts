import { v4 as uuidv4 } from "uuid";
import path from "path";
import DatabaseManager from "@main/database/DatabaseManager";
import VersionUtils from "@main/utils/VersionUtils";
import Project from "@common/project/Project";
import Study from "@common/study/Study";
import ProjectManager from "@common/project/ProjectManager";
import FileSystemManager from "@main/file-system/FileSystemManager";
import AppManager from "@main/app/AppManager";
import FileSystemStudyManager from "@main/study/FileSystemStudyManager";
import FileSystemRecentProjectManager from "@main/project/FileSystemRecentProjectManager";

export default class FileSystemProjectManager implements ProjectManager {
    private static readonly DB_FILE_NAME: string = "metadata.sqlite";

    public async loadProject(
        projectLocation: string,
        addToRecents: boolean = true
    ): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const fsManager = new FileSystemManager();

        // Check if a project is actually present in this directory. If there isn't, we cannot load the project.
        if (!await fsManager.fileExists(projectLocation + FileSystemProjectManager.DB_FILE_NAME)) {
            throw new Error("InvalidProjectException: Project metadata file was not found!");
        }

        const appManager = new AppManager();

        const dbManager = new DatabaseManager(
            projectLocation + FileSystemProjectManager.DB_FILE_NAME
        );
        await dbManager.initializeDatabase(appManager.getAppVersion());
        const dbAppVersion = dbManager.getApplicationVersion();

        if (VersionUtils.isVersionLargerThan(dbAppVersion, appManager.getAppVersion())) {
            throw new Error("ProjectVersionMismatchException: Project was made with a more recent version of Unipept Desktop!");
        } else {
            await dbManager.setApplicationVersion(appManager.getAppVersion());
        }

        const project = new Project(
            path.basename(projectLocation),
            projectLocation
        );

        const studyManager = new FileSystemStudyManager(
            dbManager,
            project
        );

        for (const study of await studyManager.loadStudies()) {
            project.addStudy(study);
        }

        if (addToRecents) {
            const recentProjectsMng = new FileSystemRecentProjectManager();
            await recentProjectsMng.addRecentProject(projectLocation);
        }

        return project;
    }

    public async createProject(
        projectLocation: string,
        addToRecents: boolean = true
    ): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        const fsManager = new FileSystemManager();

        // Create the project directory
        await fsManager.mkdir(projectLocation);

        const dbManager = new DatabaseManager(
            path.join(projectLocation, FileSystemProjectManager.DB_FILE_NAME)
        );

        const appManager = new AppManager();
        await dbManager.initializeDatabase(appManager.getAppVersion());

        // Create one dummy study for this project
        const study = new Study(uuidv4());
        study.setName("Study name");

        const project = new Project(path.basename(projectLocation), projectLocation);
        project.addStudy(study);

        const studyManager = new FileSystemStudyManager(dbManager, project);
        studyManager.writeStudy(study);

        if (addToRecents) {
            const recentProjectsMng = new FileSystemRecentProjectManager();
            await recentProjectsMng.addRecentProject(projectLocation);
        }

        return project;
    }
}
