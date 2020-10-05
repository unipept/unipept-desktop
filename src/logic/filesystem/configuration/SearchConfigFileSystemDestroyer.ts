import { Database } from "better-sqlite3";
import { SearchConfiguration, SearchConfigurationVisitor } from "unipept-web-components";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

/**
 * Remove a search configuration from a database. If no search configuration with the given id exists, no error will be
 * raised. The configuration's id will be set to undefined after it has been destroyed.
 *
 * @author Pieter Verschaffelt
 */
export default class SearchConfigFileSystemDestroyer implements SearchConfigurationVisitor {
    constructor(
        private readonly dbManager: DatabaseManager
    ) {}

    public async visitSearchConfiguration(config: SearchConfiguration): Promise<void> {
        if (config.id) {
            await this.dbManager.performQuery<void>(
                (db: Database) => db.prepare("DELETE FROM search_configuration WHERE id = ?").run(config.id)
            );
        }

        // An undefined id means that the configuration is no longer present in the database.
        config.id = undefined;
    }
}
