import DatabaseManager from "@main/database/DatabaseManager";
import Study from "@common/study/Study";
import path from "path";
import { StudyTableRow } from "@main/database/schemas/Schema";
import { Database as DbType } from "better-sqlite3";
import StudyManager from "@common/study/StudyManager";

export default class FileSystemStudyManager implements StudyManager {
    public async loadStudy(
        directory: string,
        dbManager: DatabaseManager
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
