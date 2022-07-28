import { NcbiId, ProgressReport, ProgressReportHelper } from "unipept-web-components";
import crypto from "crypto";

const progressSteps: string[] = [
    "Fetching required Docker images",
    "Creating taxon tables",
    "Initializing database build process",
    "Downloading database",
    "Processing chunks",
    "Started building main database tables",
    "Calculating lowest common ancestors",
    "Calculating functional annotations",
    "Sorting peptides",
    "Creating sequence table",
    "Fetching EC numbers",
    "Fetching GO terms",
    "Fetching InterPro entries",
    "Filling database and computing indices"
];

export type DatabaseErrorStatus = {
    status: boolean,
    message: string,
    object: Error
}

export default class CustomDatabase {
    constructor(
        public readonly name: string,
        public readonly sources: string[],
        public readonly sourceTypes: string[],
        public readonly taxa: NcbiId[],
        public readonly databaseVersion: string,
        // Amount of entries that are present in this filtered database.
        public entries: number = -1,
        // Has the database successfully been built?
        public ready: boolean = false,
        public sizeOnDisk: number = -1,
        public cancelled: boolean = false,
        public inProgress: boolean = false,
        public readonly progress: ProgressReport = ProgressReportHelper.constructProgressReportObject(progressSteps),
        public readonly error: DatabaseErrorStatus = {
            status: false,
            message: "",
            object: undefined
        }
    ) {}

    /**
     * Two custom databases are the same iff they produce the same hash value. This means that the original source,
     * source types, taxa and name of the database are also equal.
     */
    public getDatabaseHash(): string {
        return crypto.createHash("sha256").update(
            this.name + this.sources.toString() + this.sourceTypes.toString() + this.taxa.toString()
        ).digest("base64");
    }
}
