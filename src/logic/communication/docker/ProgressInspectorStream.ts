import * as stream from "stream";

export default class ProgressInspectorStream extends stream.Writable {
    constructor(
        private readonly progressReporter: (step: string, progress: number, progress_step: number) => void,
        private readonly onReadyListener: () => void,
        private readonly entryCountReporter: (n: number) => void
    ) {
        super();
    }

    _write(chunk: any, enc: string, callback: any) {
        console.log(chunk.toString());

        const lines = chunk.toString().split("\n");

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

        // If this text appears in the Docker logs, we now that the server has been started.
        if (
            chunk.toString().includes(
                "X Plugin ready for connections."
            )
        ) {
            // Wait 2 more seconds for the server to be completely ready and then notify all listeners that the database
            // has been successfully built.
            setTimeout(() => this.onReadyListener(), 2000);
        }

        callback();
    }
}
