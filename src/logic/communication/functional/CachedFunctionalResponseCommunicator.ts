import FunctionalResponseCommunicator from "unipept-web-components/src/business/communication/functional/FunctionalResponseCommunicator";
import { OntologyIdType } from "unipept-web-components/src/business/ontology/Ontology";
import FunctionalResponse from "unipept-web-components/src/business/communication/functional/FunctionalResponse";

export default class CachedFunctionalResponseCommunicator<
    OntologyId extends OntologyIdType,
    ResponseType extends FunctionalResponse<OntologyId>
> implements FunctionalResponseCommunicator<OntologyId, ResponseType> {
    constructor(private readonly codeToResponse: Map<OntologyId, ResponseType>) {}

    public async process(codes: OntologyId[]): Promise<void> {
        // Nothing needs to be done
        return;
    }

    public getResponse(code: OntologyId): ResponseType | undefined {
        return this.codeToResponse.get(code);
    }

    public getResponseMap(): Map<OntologyId, ResponseType> {
        return this.codeToResponse;
    }
}
