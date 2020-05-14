import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { promises as fs } from "fs";
import { spawn, Worker } from "threads"

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const path: string = `${this.directoryPath}${mpAssay.getName()}.pep`;

        try {
            const peptidesString: string = await fs.readFile(path, {
                encoding: "utf-8"
            });

            const readerWorker = await spawn(new Worker("./AssayFileSystemDataReader.worker.ts"));
            const splitted = await readerWorker(peptidesString);
            mpAssay.setPeptides(splitted, this.fireChange);
            console.log("Done setting peptides");
        } catch (err) {
            // The file does not exist, just return empty data
            return;
        }
    }
}
