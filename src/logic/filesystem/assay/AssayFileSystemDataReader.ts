import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { ProteomicsAssay, IOException, QueueManager } from "unipept-web-components";
import { promises as fs } from "fs";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const path: string = `${this.directoryPath}${mpAssay.getName()}.pep`;

        try {
            const peptidesString: string = await fs.readFile(path, {
                encoding: "utf-8"
            });

            const splitted = await QueueManager.getLongRunningQueue().pushTask<string[], string>(
                "readAssay",
                peptidesString
            );

            mpAssay.setPeptides(splitted);
        } catch (err) {
            // The file does not exist (yet), throw an exception
            throw new IOException(err);
        }
    }
}
