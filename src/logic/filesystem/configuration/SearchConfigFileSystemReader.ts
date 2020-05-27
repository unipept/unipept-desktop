import SearchConfigurationVisitor from "unipept-web-components/src/business/configuration/SearchConfigurationVisitor";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import { Database } from "better-sqlite3";

/**
 * Read a search configuration from a database. The search configuration's id must have been filled in for this to work.
 * If the id is not filled in, the search configuration will not be deserialized (no error will be raised).
 *
 * @author Pieter Verschaffelt
 */
export default class SearchConfigFileSystemReader implements SearchConfigurationVisitor {
    constructor(
        private readonly db: Database
    ) {}

    public visitSearchConfiguration(config: SearchConfiguration) {
        if (config.id) {
            const result = this.db.prepare("SELECT * FROM search_configuration WHERE id = ?").get(config.id);
            if (result) {
                config.equateIl = (result.equate_il === 1);
                config.filterDuplicates = (result.filter_duplicates === 1);
                config.enableMissingCleavageHandling = (result.missing_cleavage_handling === 1);
            }
        }
    }
}
