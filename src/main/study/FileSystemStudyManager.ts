import DatabaseManager from "@main/database/DatabaseManager";
import Study from "@common/study/Study";
import path from "path";
import { StudyTableRow } from "@main/database/schemas/Schema";
import { Database as DbType } from "better-sqlite3";
import StudyManager from "@common/study/StudyManager";
import { v4 as uuidv4 } from "uuid";
import FileSystemManager from "@main/file-system/FileSystemManager";
import Project from "@common/project/Project";
import { promises as fs } from "fs";
import { Database } from "better-sqlite3";


export default class FileSystemStudyManager implements StudyManager {
    constructor(
        private readonly dbManager: DatabaseManager,
        private readonly project: Project
    ) {}

    public async loadStudies(): Promise<Study[]> {
        const subDirectories: string[] = (await fs.readdir(this.project.location, { withFileTypes: true }))
            .filter(dirEntry => dirEntry.isDirectory() && dirEntry.name !== ".buffers")
            .map(dirEntry => dirEntry.name);

        const studies: Study[] = [];

        for (const directory of subDirectories) {
            studies.push(await this.loadStudy(directory));
        }

        return studies;
    }

    public async writeStudy(
        study: Study
    ): Promise<void> {
        const studyPath = path.join(this.project.location, study.getName());
        const fsManager = new FileSystemManager();

        await fsManager.mkdir(studyPath);
        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare("REPLACE INTO studies (id, name) VALUES (?, ?)").run(study.getId(), study.getName())
        });
    }

    public async removeStudy(
        study: Study
    ) {
        const studyPath = path.join(this.project.location, study.getName());
        const fsManager = new FileSystemManager();

        if (!fsManager.fileExists(studyPath)) {
            return;
        }

        // First, remove the study directory from the file system.
        await fsManager.removeFile(studyPath);

        // Then, also remove the study metadata from the database.
        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare("DELETE FROM studies WHERE id = ?").run(study.getId());
        });
    }

    /**
     * Read the properties and metadata of one study from disk and return a new study object.
     *
     * @param directory The root directory for this study object.
     * @private
     */
    private async loadStudy(
        directory: string
    ): Promise<Study> {
        if (!directory.endsWith("/")) {
            directory += "/";
        }

        const studyName: string = path.basename(directory);
        let study: Study;

        // Check if the given study name is present in the database. If not, add the study with a new ID.
        const row = await this.dbManager.performQuery<StudyTableRow | undefined>((db: DbType) => {
            return db.prepare("SELECT * FROM studies WHERE `name`=?").get(studyName) as StudyTableRow | undefined;
        });

        if (row) {
            study = new Study(row.id);
        } else {
            study = new Study(uuidv4());
        }

        study.setName(studyName);
        // Some changes might have occurred to this study while reading it (it's internal ID might have changed, so we
        // need to update the project's database reflect these changes).
        await this.writeStudy(study);

        // Read all assays that belong to this study.
        // TODO: implement reading the assays in a new AssayManager and call it here

        return study;
    }
}
