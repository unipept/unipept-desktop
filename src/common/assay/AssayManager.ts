import { Assay } from "unipept-web-components";

export default interface AssayManager {
    /**
     * Read all peptides and metadata for this assay from the datasource given in the constructor of this class. If the
     * given assay does not exist yet, an error will be thrown.
     *
     * @param assayName Name of the assay that should be read. If no file with the associated name exists in the
     * provided directory, an error will be thrown.
     * @throws { Error } If no assay with the given name exists or could be find using the information provided.
     */
    loadAssay(
        assayName: string
    ): Promise<Assay>;

    /**
     * Write all peptides and metadata for this assay to the datasource given in the constructor of this class. If the
     * given assay already exists, it will be overwritten.
     *
     * @param assay Assay object for which all information should be persistently stored.
     */
    writeAssay(
        assay: Assay
    ): Promise<void>;

    /**
     * Remove all peptides and metadata for this assay from the datasource given in the constructor of this class. If no
     * assay with the given name exists, nothing will happen.
     *
     * @param assayName Name of the assay object that should be removed.
     */
    removeAssay(
        assayName: string
    ): Promise<void>;
}
