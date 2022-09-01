import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import { Database } from "better-sqlite3";
import v1_to_v2 from "raw-loader!@/db/migrations/v1_to_v2.sql";
import path from "path";
import { store } from "@/main";
import mkdirp from "mkdirp";
import { promises as fs } from "fs";

const { app } = require('@electron/remote');

/**
 * This migrator updates the current database from schema version 0 to version 1.
 *
 * Changes between these schema versions:
 * - Added new table "database_metadata", which keeps track of the current application version.
 */
export default class DatabaseMigratorV1ToV2 implements DatabaseMigrator {
    constructor(private readonly projectLocation: string) {}

    public async upgrade(database: Database): Promise<void> {
        await this.migrateBuffers(database);
        // Read in the buffers from the database and write these to a file.
        database.exec(v1_to_v2);
    }

    private async migrateBuffers(database: Database): Promise<void> {
        const rows = database.prepare("SELECT * FROM pept2data").all();
        for (const row of rows) {
            const indexBuffer = row.index_buffer;
            const dataBuffer = row.data_buffer;
            const assayId = row.assay_id;

            // Write each of these buffers to the project directory according to the new format.
            const bufferDirectory = path.join(this.projectLocation, ".buffers");
            mkdirp.sync(bufferDirectory);

            const indexBufferPath = path.join(bufferDirectory, assayId + ".index");
            const dataBufferPath = path.join(bufferDirectory, assayId + ".data");

            // Write new version of this file's buffer to file
            await fs.writeFile(indexBufferPath, indexBuffer);
            await fs.writeFile(dataBufferPath, dataBuffer);
        }
    }
}
