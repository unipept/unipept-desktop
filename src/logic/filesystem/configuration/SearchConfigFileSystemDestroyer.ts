import SearchConfigurationVisitor from "unipept-web-components/src/business/configuration/SearchConfigurationVisitor";
import { Database } from "better-sqlite3";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";

/**
 * Remove a search configuration from a database. If no search configuration with the given id exists, no error will be
 * raised. The configuration's id will be set to undefined after it has been destroyed.
 *
 * @author Pieter Verschaffelt
 */
export default class SearchConfigFileSystemDestroyer implements SearchConfigurationVisitor {
    constructor(
        private readonly db: Database
    ) {}

    public visitSearchConfiguration(config: SearchConfiguration) {
        // First check if a config with the given id is present in the database.
        if (config.id) {
            const results = this.db.prepare("SELECT * FROM search_configuration WHERE id = ?").get(config.id);

            if (results) {
                // It is present, now we can remove it without problems.
                this.db.prepare("DELETE FROM search_configuration WHERE id = ?").run(config.id);
            }
        }

        // An undefined id means that the configuration is no longer present in the database.
        config.id = undefined;
    }
}
