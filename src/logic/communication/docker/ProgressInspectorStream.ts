import * as stream from "stream";

export default class ProgressInspectorStream extends stream.Writable {
    constructor(
        private readonly progressReporter: (step: string, progress: number) => void,
        private readonly onReadyListener: () => void
    ) {
        super();
    }

    _write(chunk: any, enc: string, callback: any) {
        const lines = chunk.toString().split("\n");

        const progressReports: [string, number][] = lines
            .filter((l: string) => l.includes("PROGRESS"))
            .map((l: string) => l.split("<->").map((x: string) => x.trim()).slice(1))
            .map((parts: string[]) => [parts[0], Number.parseInt(parts[1])]);

        if (progressReports.length > 0) {
            const [step, value] = progressReports[progressReports.length - 1];
            this.progressReporter(step, value);
        }

        callback();
    }
}
