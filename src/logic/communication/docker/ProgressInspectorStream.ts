import * as stream from "stream";

export default class ProgressInspectorStream extends stream.Writable {
    /**
     * @param progressReporter A callback that's called when the progress value needs to be updated. The first parameter
     * contains a description of the step that's being performed, the second parameter denotes the current progress
     * value for this step and the last parameter provides the index that corresponds to this step (i.e. is this the
     * i'th step?).
     * @param onReadyListener A callback that's called when the container indicates that it's done processing.
     * @param entryCountReporter A callback that's called with the amount of UniProt entries that are eventually
     * present in the database.
     * @param logReporter A callback that's called everytime a new line of log content is read.
     */
    constructor(
        private readonly progressReporter: (step: string, progress: number, progress_step: number) => void,
        private readonly onReadyListener: () => void,
        private readonly entryCountReporter: (n: number) => void,
        private readonly logReporter: (line: string) => void
    ) {
        super();
    }

    _write(chunk: any, enc: string, callback: any) {
        const lines = chunk
            .toString()
            .split("\n")
            .map((l: string) => l.trimEnd()).filter((l: string) => l !== "");

        for (const line of lines) {
            this.logReporter(line);
        }

        const progressReports: [string, number, number][] = lines
            .filter((l: string) => l.includes("PROGRESS"))
            .map((l: string) => l.split("<->").map((x: string) => x.trim()).slice(1))
            .map((parts: string[]) => [parts[0], Number.parseInt(parts[1]), Number.parseInt(parts[2])]);

        if (progressReports.length > 0) {
            const [step, value, progress_step] = progressReports[progressReports.length - 1];
            this.progressReporter(step, value, progress_step);
        }

        if (
            chunk.toString().includes("Database contains: ")
        ) {
            this.entryCountReporter(parseInt(chunk.toString().split("##")[1]));
        }

        // If this text appears in the Docker logs, we know that the server has been started.
        if (
            chunk.toString().includes(
                "mariadbd: Shutdown complete"
            )
        ) {
            // Wait 2 more seconds for the server to be completely ready and then notify all listeners that the database
            // has been successfully built.
            setTimeout(() => this.onReadyListener(), 2000);
        }

        callback();
    }
}
