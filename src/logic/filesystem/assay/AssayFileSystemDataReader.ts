import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { ProteomicsAssay, IOException } from "unipept-web-components";
import { promises as fs } from "fs";
import { spawn, Worker } from "threads"
import { Database } from "better-sqlite3";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    private static worker: any;

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const path: string = `${this.directoryPath}${mpAssay.getName()}.pep`;

        try {
            const start = new Date().getTime();
            const peptidesString: string = await fs.readFile(path, {
                encoding: "utf-8"
            });

            if (!AssayFileSystemDataReader.worker) {
                AssayFileSystemDataReader.worker = await spawn(new Worker("./AssayFileSystemDataReader.worker.ts"));
            }

            const splitted = await AssayFileSystemDataReader.worker(peptidesString);
            const end = new Date().getTime();
            console.log("Reading in peptides from file: " + (end - start) / 1000 + "s");
            mpAssay.setPeptides(splitted);
        } catch (err) {
            // The file does not exist (yet), throw an exception
            throw new IOException(err);
        }
    }
}
