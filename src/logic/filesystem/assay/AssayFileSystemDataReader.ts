import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { promises as fs } from "fs";
import { spawn, Worker } from "threads"
import IOException from "unipept-web-components/src/business/exceptions/IOException";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    private static worker;

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const path: string = `${this.directoryPath}${mpAssay.getName()}.pep`;

        try {
            const peptidesString: string = await fs.readFile(path, {
                encoding: "utf-8"
            });

            if (!AssayFileSystemDataReader.worker) {
                AssayFileSystemDataReader.worker = await spawn(new Worker("./AssayFileSystemDataReader.worker.ts"));
            }

            const splitted = await AssayFileSystemDataReader.worker(peptidesString);
            mpAssay.setPeptides(splitted);
        } catch (err) {
            // The file does not exist (yet), throw an exception
            throw new IOException(err);
        }
    }
}
