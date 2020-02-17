import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import Project from "../project/Project";
import { StorageType } from "unipept-web-components/src/logic/data-management/StorageType";

export default class FileSystemAssay extends MetaProteomicsAssay {
    private readonly project: Project;

    constructor(project: Project, id?: string, storageType?: StorageType, name?: string, date?: Date) {
        super(id, storageType, name, date);
        this.project = project;
    }
}
