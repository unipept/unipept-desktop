import CachedFunctionalResponseCommunicator
    from "@/logic/communication/functional/CachedFunctionalResponseCommunicator";
import { GoCode } from "unipept-web-components/src/business/ontology/functional/go/GoDefinition";
import { GoResponse } from "unipept-web-components/src/business/communication/functional/go/GoResponse";
import GoResponseCommunicator from "unipept-web-components/src/business/communication/functional/go/GoResponseCommunicator";
import { convertStringToGoNamespace } from "unipept-web-components/src/business/ontology/functional/go/GoNamespace";

export default class CachedGoResponseCommunicator extends CachedFunctionalResponseCommunicator<GoCode, GoResponse> {
    constructor() {
        super(new GoResponseCommunicator(), "SELECT * FROM go_terms WHERE `code` = ?");
    }

    protected convertToResponse(row: any): GoResponse {
        if (row) {
            return {
                code: row.code,
                name: row.name,
                namespace: row.namespace
            }
        }
        return undefined;
    }
}
