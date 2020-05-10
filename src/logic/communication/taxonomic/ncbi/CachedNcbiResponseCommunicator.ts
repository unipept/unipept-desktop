import NcbiResponseCommunicator from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponseCommunicator";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import NcbiResponse from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponse";

export default class CachedNcbiResponseCommunicator extends NcbiResponseCommunicator {
    constructor(private readonly codeToResponse: Map<NcbiId, NcbiResponse>) {
        super();
    }

    public async process(codes: NcbiId[]): Promise<void> {
        // Nothing needs to be done...
        return;
    }

    public getResponse(id: NcbiId): NcbiResponse {
        return this.codeToResponse.get(id);
    }
}
