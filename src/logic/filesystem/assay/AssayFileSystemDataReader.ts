import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import { ProteomicsAssay, IOException, QueueManager } from "unipept-web-components";
import { promises as fs } from "fs";
import Worker from "worker-loader?inline=fallback!./AssayFileSystemDataReader.worker";

export default class AssayFileSystemDataReader extends FileSystemAssayVisitor {
    private static inProgress: Promise<string[]>;
    private static worker: Worker;

    public async visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void> {
        const path: string = `${this.directoryPath}${mpAssay.getName()}.pep`;

        try {
            const peptidesString: string = await fs.readFile(path, {
                encoding: "utf-8"
            });

            while (AssayFileSystemDataReader.inProgress) {
                await AssayFileSystemDataReader.inProgress;
            }

            AssayFileSystemDataReader.inProgress = new Promise<string[]>((resolve) => {
                if (!AssayFileSystemDataReader.worker) {
                    AssayFileSystemDataReader.worker = new Worker();
                }

                const eventListener = (message: MessageEvent) => {
                    AssayFileSystemDataReader.worker.removeEventListener("message", eventListener);
                    resolve(message.data);
                };

                AssayFileSystemDataReader.worker.addEventListener("message", eventListener);

                AssayFileSystemDataReader.worker.postMessage(peptidesString);
            });

            const splitted = await AssayFileSystemDataReader.inProgress;
            AssayFileSystemDataReader.inProgress = undefined;

            mpAssay.setPeptides(splitted);
        } catch (err) {
            // The file does not exist (yet), throw an exception
            throw new IOException(err);
        }

    }
}
