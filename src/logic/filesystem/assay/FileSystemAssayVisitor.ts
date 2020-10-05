import { Database } from "better-sqlite3";
import { AssayVisitor, ProteomicsAssay } from "unipept-web-components";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

/**
 * A specific kind of visitor for assays that's specifically tailored at storing and reading information from the
 * local filesystem. By referencing a
 */
export default abstract class FileSystemAssayVisitor implements AssayVisitor {
    protected directoryPath: string;
    protected readonly dbManager: DatabaseManager;

    /**
     * @param directoryPath path to the parent directory of this assay.
     * @param dbManager The database-object that keeps track of metadata for the assays.
     */
    constructor(directoryPath: string, dbManager: DatabaseManager) {
        if (!directoryPath.endsWith("/")) {
            directoryPath += "/";
        }
        this.directoryPath = directoryPath;
        this.dbManager = dbManager;
    }

    public abstract visitProteomicsAssay(mpAssay: ProteomicsAssay): Promise<void>;
}
