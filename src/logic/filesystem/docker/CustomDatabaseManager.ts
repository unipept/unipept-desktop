import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { promises as fs } from "fs";
import path, { dirname } from "path";
import mkdirp from "mkdirp";

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
            if ((await fs.lstat(path.join(dbRootFolder, "databases", dir))).isDirectory()) {
                // Check if a metadata file is present in the folder that was found. If it is present, we should read
                // the database name and other metadata from this file.
                try {
                    const metadata = JSON.parse(
                        await fs.readFile(
                            this.metadataPath(dbRootFolder, dir),
                            { encoding: "utf-8" }
                        )
                    );

                    databases.push(
                        new CustomDatabase(
                            metadata.name,
                            metadata.sources,
                            metadata.sourceTypes,
                            metadata.taxa,
                            metadata.entries,
                            metadata.databaseVersion,
                            metadata.complete
                        )
                    );
                } catch (e) {
                    // The inspected directory probably doesn't contain a database and we should do nothing in this
                    // case.
                }
            }
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
        const path = this.metadataPath(dbRootFolder, db.name);
        // Make sure that the path to the database that we want to build actually exists, before trying to write the
        // metadata file to it.d .
        await fs.mkdir(dirname(path), { recursive:true })
        return fs.writeFile(path, JSON.stringify(db));
    }

    public async deleteDatabase(dbRootFolder: string, db: CustomDatabase): Promise<void> {
        const dbPath = path.join(dbRootFolder, "databases", db.name);
        await fs.rmdir(dbPath, { recursive: true });
    }

    /**
     * Returns the most appropriate URL that can be used to download the specific UniProt database. This function will
     * automatically take into account the current location of the user and point the user to the closest FTP mirror.
     * Note that location detection of the user is very rudimentary and only provides a rough estimate of the user's
     * current point of residence (e.g. Europe, United States, ...).
     *
     * @param dbVersionId A valid version identifier in the format YYYY.MM (that should point to an existing UniProt
     * version) or "current" for the most recent version of the database.
     */
    public getUrl(
        dbVersionId: string
    ): string {
        if (dbVersionId.toLowerCase() === "current") {
            // The user wants to download the most recent version of the UniProt database and we should check the user's
            // current location (e.g. Europe, United States, Africa, ...) to determine what the most appropriate
            // mirror is.
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // if (timezone && timezone.toLowerCase().includes("europe")) {
            //     // The user is situated in Europe and we should use Expasy as our default FTP server.
            //     return
            // } else {
            //     return
            // }
        }

        return "";
    }

    /**
     * Constructs the path to a folder wherein the database's metadata should be stored.
     *
     * @param dbRootFolder The root folder in which all custom database information for the complete application is
     * kept. This folder should contain one folder per custom database (and a metadata file per custom database folder).
     * @param dbName Name of the custom database for which the path to it's metadata file on the filesystem should be
     * constructed.
     */
    private metadataPath(dbRootFolder: string, dbName: string): string {
        return path.join(dbRootFolder, "databases", dbName, "metadata", "metadata.json");
    }
}
