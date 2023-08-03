import { SearchConfigurationVisitor, SearchConfiguration } from "unipept-web-components";
import { Database, RunResult } from "better-sqlite3";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

/**
 * Writes a search configuration to a database. If the configuration's id is undefined, a new config will be created,
 * otherwise the existing row in the database will be updated.
 *
 * @author Pieter Verschaffelt
 */
export default class SearchConfigFileSystemWriter implements SearchConfigurationVisitor {
    constructor(
        private readonly dbManager: DatabaseManager
    ) {}

    public async visitSearchConfiguration(config: SearchConfiguration): Promise<void> {
        let insertNew = true;

        // Check if the search configuration already exists in the database.
        if (config.id) {
            const result = await this.dbManager.performQuery<any>((db: Database) => {
                return db.prepare("SELECT * FROM search_configuration WHERE id = ?").get(config.id);
            });

            if (result) {
                insertNew = false;
            }
        }

        if (insertNew) {
            await this.dbManager.performQuery<void>((db: Database) => {
                const info: RunResult = db.prepare(
                    `
                INSERT INTO search_configuration (equate_il, filter_duplicates, missing_cleavage_handling)
                VALUES (?, ?, ?)
            `
                ).run(
                    config.equateIl ? 1 : 0,
                    config.filterDuplicates ? 1 : 0,
                    config.enableMissingCleavageHandling ? 1: 0
                );

                config.id = info.lastInsertRowid.toString();
            });
        } else {
            await this.dbManager.performQuery<void>((db: Database) => {
                db.prepare(
                    "UPDATE search_configuration SET equate_il = ?, filter_duplicates = ?, missing_cleavage_handling = ? WHERE `id` = ?"
                ).run(config.equateIl ? 1 : 0, config.filterDuplicates ? 1 : 0, config.enableMissingCleavageHandling ? 1 : 0, config.id);
            });
        }
    }
}
