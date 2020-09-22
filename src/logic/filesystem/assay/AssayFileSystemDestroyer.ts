import FileSystemAssayVisitor from "./FileSystemAssayVisitor";
import { promises as fs } from "fs";
import { ProteomicsAssay, IOException } from "unipept-web-components";
import SearchConfigFileSystemDestroyer from "@/logic/filesystem/configuration/SearchConfigFileSystemDestroyer";
import { spawn, Worker } from "threads/dist";
import { Database } from "better-sqlite3";

/**
 * Removes both the metadata and raw data for an assay.
 */
export default class AssayFileSystemDestroyer extends FileSystemAssayVisitor {
    private static worker: any;

    constructor(
        directoryPath: string,
        db: Database,
        private readonly dbFile: string
    ) {
        super(directoryPath, db);
    }


    /**
     * @throws {IOException}
     */
    public async visitProteomicsAssay(assay: ProteomicsAssay): Promise<void> {
        try {
            const path: string = `${this.directoryPath}${assay.getName()}.pep`;

            try {
                await fs.unlink(path);
            } catch (err) {
                // File does no longer exist, which is not an issue here.
            }

            if (!AssayFileSystemDestroyer.worker) {
                AssayFileSystemDestroyer.worker = await spawn(new Worker("./AssayFileSystemDestroyer.worker.ts"));
            }

            await AssayFileSystemDestroyer.worker(assay.getId(), this.dbFile, __dirname);

            const configDestroyer = new SearchConfigFileSystemDestroyer(this.db);
            configDestroyer.visitSearchConfiguration(assay.getSearchConfiguration());
        } catch (e) {
            throw new IOException(e);
        }
    }
}
