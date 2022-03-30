import { promises as fs } from "fs";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database } from "better-sqlite3";
import { Study } from "unipept-web-components";

export default class StudyManager {
    constructor(
        private readonly dbManager: DatabaseManager,
        private readonly projectLocation: string
    ) {}

    public async renameStudy(study: Study, oldName: string, newName: string) {
        await fs.rename(this.projectLocation + oldName, this.projectLocation + newName);
        await this.dbManager.performQuery((db: Database) => {
            db.prepare("UPDATE studies SET name = ? WHERE id = ?").run(newName, study.getId());
        });
    }
}
