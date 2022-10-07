import { NcbiId } from "unipept-web-components";

export default class Proteome {
    constructor(
        // String that uniquely identifies this reference proteome.
        public readonly id: string,
        // Name of the organism to which this proteome is associated.
        public readonly organismName: string,
        // NCBI ID of the organism to which this proteome is associated.
        public readonly organismId: NcbiId,
        // The amount of proteins that are present in this reference proteome.
        public readonly proteinCount: number
    ) {}
}
