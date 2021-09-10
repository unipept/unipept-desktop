import { promises as fsPromises } from "fs";
import fs from "fs";
import { https } from "follow-redirects";
import path from "path";
import { ProgressListener } from "unipept-web-components";
import yauzl, { Entry, ZipFile } from "yauzl";
import { Readable } from "stream";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import sqlite3 from "better-sqlite3";

const { app } = require("electron").remote;

/**
 * This class manages the database containing static information about taxons and functional annotations. This class can
 * be used to check if the currently installed version is the most recent one, and allows to update it if required.
 *
 * Note that we need to use the nodejs provided https-library to download files from GitHub as we get into CORS-trouble
 * with fetch and axios.
 *
 * @author Pieter Verschaffelt
 */
export default class StaticDatabaseManager {
    public static readonly STATIC_DB_VERSION_POINTER = "https://raw.githubusercontent.com/unipept/make-database/master/workflows/static_database/version.txt";
    public static readonly STATIC_DB_URL = "https://github.com/unipept/make-database/releases/latest/download/";

    private static db: sqlite3.Database;

    /**
     * Check if the most recent version of the static information database is present in the userdata folder. If the
     * database is not present or if it's outdated this function returns true.
     *
     * @return true if the static information database in the filesystem is outdated or not present.
     */
    public async requiresUpdate(): Promise<boolean> {
        const mostRecentVersion = await this.getMostRecentVersion();

        try {
            const currentVersion = await this.getCurrentVersion();
            return mostRecentVersion > currentVersion;
        } catch (err) {
            // The version file is not present and why require updating.
            return true;
        }
    }

    /**
     * This function downloads the most recent zipped version of the database from the server to a temporary folder.
     * The zipped database is then unzipped and installed into the userdata directory and available for use. Throws an
     * error is the database could not be installed for some reason.
     *
     * @param listener Get updates on the progress / installation process.
     */
    public async updateDatabase(listener?: ProgressListener): Promise<void> {
        const zippedDbPath = path.join(app.getPath("temp"), "static-db.zip");

        // First download the zipped database to a temporary folder.
        const mostRecentVersion = await this.getMostRecentVersion();

        const year = mostRecentVersion.getFullYear();
        const month = (mostRecentVersion.getMonth() + 1).toString().padStart(2, "0");
        const day = mostRecentVersion.getDate().toString().padStart(2, "0");

        const databaseUrl = `${StaticDatabaseManager.STATIC_DB_URL}unipept-static-db-${year}-${month}-${day}.zip`;
        const zippedWriter = fs.createWriteStream(zippedDbPath);

        try {
            await new Promise<void>((resolve, reject) => {
                https.get(
                    databaseUrl,
                    (resp: any) => {
                        const totalLength = parseInt(resp.headers["content-length"]);
                        let processedLength = 0;

                        const pipe = resp.pipe(zippedWriter);

                        pipe.on("error", reject)
                        resp.on("end", resolve);
                        resp.on("data", function(chunk: any) {
                            processedLength += chunk.length;

                            if (listener) {
                                listener.onProgressUpdate((processedLength / totalLength) * 0.9);
                            }
                        });
                    }
                );
            });
        } finally {
            zippedWriter.close();
        }


        // Now we should also unzip the downloaded file and copy it to it's permanent location (the userdata directory
        // of electron).
        const databasePath = this.getDatabasePath();
        const unzippedWriter = fs.createWriteStream(databasePath);

        await new Promise<void>((resolve, reject) => {
            yauzl.open(zippedDbPath, { lazyEntries: true }, (err: Error, zipFile: ZipFile) => {
                if (err) {
                    reject(err);
                }

                zipFile.readEntry();
                zipFile.on("entry", (entry: Entry) => {
                    // file entry
                    zipFile.openReadStream(entry, (err: Error, readStream: Readable) => {
                        if (err) {
                            reject(err);
                        }

                        readStream.on("end", () => {
                            resolve();
                        });

                        readStream.pipe(unzippedWriter);
                    });
                });
            });
        });

        unzippedWriter.close();

        // Update the version file that keeps track of which version of the db is installed locally.
        const versionFile = this.getVersionFilePath();
        await fsPromises.writeFile(
            versionFile,
            `${mostRecentVersion.getFullYear()}-${mostRecentVersion.getMonth() + 1}-${mostRecentVersion.getDate()}`,
            { encoding: "utf-8" }
        );

        if (listener) {
            listener.onProgressUpdate(1);
        }
    }

    /**
     * Contacts the remote database host and returns the Date that corresponds to that databases' version. Throws an
     * error if reading the remote version was not possible.
     *
     * @returns The Date corresponding to the most recent version of the database that's present.
     */
    public async getMostRecentVersion(): Promise<Date> {
        const data = await new Promise<string>((resolve, reject) => {
            https.get(StaticDatabaseManager.STATIC_DB_VERSION_POINTER, (resp: any) => {
                let contents: string = "";
                resp.on("data", (chunk: any) => {
                    contents += chunk;
                });

                resp.on("end", () => {
                    resolve(contents);
                });
            });
        })

        const dateParts = data.split("-");
        return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }

    /**
     * Find what version of the database is installed locally. Throws an error if no version could be determined
     * (which means that the database is probably not installed yet).
     *
     * @return The Date corresponding to this version of the database that's locally installed.
     */
    public async getCurrentVersion(): Promise<Date> {
        const versionFile = this.getVersionFilePath();
        const currentVersion: string = await fsPromises.readFile(versionFile, { encoding: "utf-8" });
        const dateParts = currentVersion.split("-");
        return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }

    /**
     * Returns an instance of the static database that can be queried immediately. Throws an error if the static
     * database file seems not to be present.
     */
    public getDatabase(): sqlite3.Database {
        if (!StaticDatabaseManager.db) {
            StaticDatabaseManager.db = new sqlite3(this.getDatabasePath(), { verbose: console.log });
        }

        return StaticDatabaseManager.db;
    }

    public getDatabasePath(): string {
        const configurationFolder = app.getPath("userData");
        return path.join(configurationFolder, "static-database.db");
    }

    private getVersionFilePath(): string {
        const configurationFolder = app.getPath("userData");
        return path.join(configurationFolder, "version.txt");
    }
}
