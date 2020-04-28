import { Database } from "better-sqlite3";
import AssayVisitor from "unipept-web-components/src/business/entities/assay/AssayVisitor";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";

/**
 * A specific kind of visitor for assays that's specifically tailored at storing and reading information from the
 * local filesystem. By referencing a
 */
export default abstract class FileSystemAssayVisitor implements AssayVisitor {
    protected directoryPath: string;
    protected readonly db: Database;

    /**
     * @param directoryPath path to the parent directory of this assay.
     * @param db The database-object that keeps track of metadata for the assays.
     */
    constructor(directoryPath: string, db: Database) {
        if (!directoryPath.endsWith("/")) {
            directoryPath += "/";
        }
        this.directoryPath = directoryPath;
        this.db = db;
    }

    public abstract visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void>;
}
