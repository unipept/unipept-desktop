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
        // A list of NCBI taxon IDs that are used for filtering this database.
        public readonly taxa: NcbiId[],
        // Version of the UniProt-database that was used for constructing this database.
        public readonly databaseVersion: string,
        // Amount of entries that are present in this filtered database.
        public entries: number = -1,
        // Has the database successfully been built?
        public ready: boolean = false,
        // The size of this database's folder on the disk in bytes. Use -1 if the size is not available.
        public sizeOnDisk: number = -1,
        // Has the construction process for this database been cancelled?
        public cancelled: boolean = false,
        // Is the construction process for this database in progress?
        public inProgress: boolean = false,
        // What's the status of the construction process of this database? What step is currently being processed
        // and which portion of this step has been processed?
        public readonly progress: ProgressReport = ProgressReportHelper.constructProgressReportObject(progressSteps),
        public readonly error: DatabaseErrorStatus = {
            status: false,
            message: "",
            object: undefined
        }
    ) {}

    /**
     * Two custom databases are the same iff they produce the same hash value.
     *
     * TODO: Note that we don't care about the UniProt version at this point in time, since the application does not
     * TODO: support the construction of databases from older UniProt versions.
     */
    public getDatabaseHash(): string {
        return crypto.createHash("sha256").update(
            this.sourceTypes.sort().toString() + this.taxa.sort().toString() + this.entries.toString()
        ).digest("base64");
    }
}
