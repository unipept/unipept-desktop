import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import Entity from "unipept-web-components/src/logic/data-management/assay/Entity";

export default class Study implements Entity<string> {
    public readonly assays: Assay[] = [];
    public readonly name: string;

    private id: string;
    
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    public getId(): string {
        return this.id;
    }

    public setId(id: string) {
        this.id = id;
    }
}
