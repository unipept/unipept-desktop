import CachedFunctionalResponseCommunicator
    from "@/logic/communication/functional/CachedFunctionalResponseCommunicator";
import { EcResponse } from "unipept-web-components/src/business/communication/functional/ec/EcResponse";
import { EcCode } from "unipept-web-components/src/business/ontology/functional/ec/EcDefinition";
import EcResponseCommunicator from "unipept-web-components/src/business/communication/functional/ec/EcResponseCommunicator";

export default class CachedEcResponseCommunicator extends CachedFunctionalResponseCommunicator<EcCode, EcResponse> {
    constructor() {
        super(new EcResponseCommunicator(), "SELECT * FROM ec_numbers WHERE `code` = ?", "EC:");
    }

    protected convertToResponse(row: any): EcResponse {
        if (row) {
            return {
                code: "EC:" + row.code,
                name: row.name
            }
        }
        return undefined;
    }
}
