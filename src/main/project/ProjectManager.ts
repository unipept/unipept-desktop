import { promises as fs } from "fs";
import path from "path";
import DatabaseManager from "@main/database/DatabaseManager";
import VersionUtils from "@main/utils/VersionUtils";
import Project from "@common/project/Project";
import Study from "@common/study/Study";
import { StudyTableRow } from "@main/database/schemas/Schema";
import { Database as DbType } from "better-sqlite3";

export default class ProjectManager {
    public static readonly DB_FILE_NAME: string = "metadata.sqlite";

    public async loadExistingProject(
        projectLocation: string,
        currentAppVersion: string
    ): Promise<Project> {
        if (!projectLocation.endsWith("/")) {
            projectLocation += "/";
        }

        try {
            fs.stat(projectLocation + ProjectManager.DB_FILE_NAME);
        } catch (err) {
            throw new Error("InvalidProjectException: Project metadata file was not found!");
        }

        const dbManager = new DatabaseManager(projectLocation + ProjectManager.DB_FILE_NAME);
        await dbManager.initializeDatabase(currentAppVersion);
        const dbAppVersion = dbManager.getApplicationVersion();

        if (VersionUtils.isVersionLargerThan(dbAppVersion, currentAppVersion)) {
            throw new Error("ProjectVersionMismatchException: Project was made with a more recent version of Unipept Desktop!");
        } else {
            await dbManager.setApplicationVersion(currentAppVersion);
        }

        // Check all subdirectories of the given project and try to load the studies.
        const subDirectories: string[] = (await fs.readdir(projectLocation, { withFileTypes: true }))
            .filter(dirEntry => dirEntry.isDirectory() && dirEntry.name !== ".buffers")
            .map(dirEntry => dirEntry.name);

        const studies = [];

        for (const directory of subDirectories) {
            studies.push(await this.loadStudy(`${projectLocation}${directory}`, dbManager, projectLocation));
        }


    }

    private async loadStudy(
        directory: string,
        dbManager: DatabaseManager,
        projectLocation: string
    ): Promise<Study> {
        if (!directory.endsWith("/")) {
            directory += "/";
        }

        const studyName: string = path.basename(directory);

        // Check if the given study name is present in the database. If not, add the study with a new ID.
        const row = await dbManager.performQuery<StudyTableRow | undefined>((db: DbType) => {
            return db.prepare("SELECT * FROM studies WHERE `name`=?").get(studyName) as StudyTableRow | undefined;
        });


    }
}
