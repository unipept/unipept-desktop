import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import { Database } from "better-sqlite3";

/**
 * A specific kind of visitor for assays that's specifically tailored at storing and reading information from the
 * local filesystem. By referencing a
 */
export default abstract class FileSystemAssayVisitor implements AssayVisitor {
    protected directoryPath: string;
    protected readonly db: Database;

    /**
     * @param directoryPath path to the parent directory of this assay.
     */
    constructor(directoryPath: string, db: Database) {
        if (!directoryPath.endsWith("/")) {
            directoryPath += "/";
        }
        this.directoryPath = directoryPath;
        this.db = db;
    }

    public abstract visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void>;
    public abstract visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void>;
}
