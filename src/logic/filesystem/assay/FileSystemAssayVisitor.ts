import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";

/**
 * A specific kind of visitor for assays that's specifically tailored at storing and reading information from the
 * local filesystem. By referencing a
 */
export default abstract class FileSystemAssayVisitor implements AssayVisitor {
    protected directoryPath: string;

    /**
     * @param directoryPath path to the parent directory of this assay.
     */
    constructor(directoryPath: string) {
        if (!directoryPath.endsWith("/")) {
            directoryPath += "/";
        }
        this.directoryPath = directoryPath;
    }

    public abstract visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void>;
    public abstract visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void>;
}
