import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { SearchConfigurationTableRow } from "@/logic/filesystem/database/Schema";
import { Database } from "better-sqlite3";
import { SearchConfiguration } from "unipept-web-components";

export default class SearchConfigManager {
    constructor(
        private readonly dbManager: DatabaseManager
    ) {}

    public async readSearchConfig(id: number): Promise<SearchConfiguration | undefined> {
        const searchRow = await this.dbManager.performQuery<SearchConfigurationTableRow>((db: Database) => {
            return db.prepare("SELECT * FROM search_configuration WHERE id = ?").get(id);
        });

        if (searchRow) {
            return new SearchConfiguration(
                searchRow.equate_il === 1,
                searchRow.filter_duplicates === 1,
                searchRow.missing_cleavage_handling === 1,
                searchRow.id.toString()
            );
        } else {
            return undefined;
        }
    }

    /**
     * Write the given object to the database. Note that the search configuration will be added as a new record in the
     * database if the given id of the config does not exist, or if no id has been set. A new id will be set for this
     * config in that case. If the id that's associated with the given search configuration is already present in the
     * database, the old search configuration will be updated with the values from the object given here.
     *
     * @param config The search configuration that should be updated or written to the database.
     */
    public async writeSearchConfig(config: SearchConfiguration): Promise<void> {
        await this.dbManager.performQuery<void>((db: Database) => {
            const info = db.prepare(
                `
                    REPLACE INTO search_configuration (equate_il, filter_duplicates, missing_cleavage_handling)
                    VALUES (?, ?, ?)
                `
            ).run(
                config.equateIl ? 1 : 0,
                config.filterDuplicates ? 1 : 0,
                config.enableMissingCleavageHandling ? 1 : 0,
            );

            config.id = info.lastInsertRowid.toString();
        });
    }

    /**
     * Remove the search configuration entry from the database with the given id.
     *
     * @param id The id of the search configuration that should be deleted from the database. If this id is not present
     * in the database, nothing will happen.
     * @return true if a value has been deleted, false otherwise.
     */
    public async destroySearchConfig(id: number): Promise<boolean> {
        return this.dbManager.performQuery<boolean>((db: Database) => {
            const result = db.prepare("DELETE FROM search_configuration WHERE id = ?").run(id);
            return result.changes !== 0;
        });
    }
}
