import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { promises as fs } from "fs";
import path from "path";

/**
 * This class is responsible for managing the custom databases that are currently created by some of the users and to
 * make sure that all of this information is persisted on the filesystem. A specific config directory structure will
 * be used to track the databases that have been build, that still need to be build and that will be created in the
 * future.
 *
 * There is one root database folder that's managed by this application itself. For every custom database that needs to
 * be constructed one new folder will be created that always contains one metadata file (with some information about
 * the database itself) and then the database specific data files. The metadata will indicate whether the database
 * construction for this file succeeded.
 *
 * @author Pieter Verschaffelt
 */
export default class CustomDatabaseManager {
    /**
     * Returns a list of all custom databases known to this application, both complete and incomplete variants. Make
     * sure to always check if a database is complete before trying to connect to it.
     *
     * @param dbRootFolder The root folder in which all custom database information for the complete application is
     * kept. This folder should contain one folder per custom database (and a metadata file per custom database folder).
     */
    public async listAllDatabases(dbRootFolder: string): Promise<CustomDatabase[]> {
        const databases = [];
        for (const dir of (await fs.readdir(path.join(dbRootFolder, "databases")))) {
            // Check if a metadata file is present in the folder that was found. If it is present, we should read the
            // database name and other metadata from this file.
            const metadata = JSON.parse(await fs.readFile(
                path.join(dbRootFolder, "databases", dir, "metadata.json"),
                { encoding: "utf-8" }
            ));

            databases.push(
                new CustomDatabase(
                    metadata.name,
                    metadata.sources,
                    metadata.sourceTypes,
                    metadata.taxa,
                    metadata.entries,
                    metadata.complete
                )
            )
        }
        return databases;
    }

    /**
     * Returns a list of all custom databases that are completely built.
     *
     * @param dbRootFolder The root folder in which all custom database information for the complete application is
     * kept. This folder should contain one folder per custom database (and a metadata file per custom database folder).
     */
    public async listAllBuildDatabases(dbRootFolder: string): Promise<CustomDatabase[]> {
        return (await this.listAllDatabases(dbRootFolder)).filter(c => c.complete);
    }

    /**
     * Returns a list of all databases that are incomplete or missing at least part of their data files. These databases
     * should probably be rebuild before trying to use them!
     *
     * @param dbRootFolder The root folder in which all custom database information for the complete application is
     * kept. This folder should contain one folder per custom database (and a metadata file per custom database folder).
     */
    public async listAllIncompleteDatabases(dbRootFolder: string): Promise<CustomDatabase[]> {
        return (await this.listAllDatabases(dbRootFolder)).filter(c => !c.complete);
    }

    /**
     * Overwrite the metadata information that's currently present in the filesystem for a specific database. Metadata
     * that was previously stored in this file for this database will be lost and replaced by the metadata provided
     * as an argument to this function.
     *
     * @param dbRootFolder The root folder in which all custom database information for the complete application is
     * kept. This folder should contain one folder per custom database (and a metadata file per custom database folder).
     * @param db CustomDatabase object for which the metadata should be updated.
     */
    public async updateMetadata(dbRootFolder: string, db: CustomDatabase): Promise<void> {
        const path = this.metadataPath(dbRootFolder, db);
        return fs.writeFile(path, JSON.stringify(db));
    }

    /**
     * Constructs the path to a folder wherein the database's metadata should be stored.
     *
     * @param dbRootFolder The root folder in which all custom database information for the complete application is
     * kept. This folder should contain one folder per custom database (and a metadata file per custom database folder).
     * @param db CustomDatabase object for which the path to it's metadata file on the filesystem should be constructed.
     */
    private metadataPath(dbRootFolder: string, db: CustomDatabase): string {
        return path.join(dbRootFolder, "databases", db.name, "metadata.json");
    }
}
