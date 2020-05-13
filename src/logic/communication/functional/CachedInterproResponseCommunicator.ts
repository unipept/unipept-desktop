import CachedFunctionalResponseCommunicator
    from "@/logic/communication/functional/CachedFunctionalResponseCommunicator";
import { InterproCode } from "unipept-web-components/src/business/ontology/functional/interpro/InterproDefinition";
import InterproResponse from "unipept-web-components/src/business/communication/functional/interpro/InterproResponse";
import InterproResponseCommunicator from "unipept-web-components/src/business/communication/functional/interpro/InterproResponseCommunicator";

export default class CachedInterproResponseCommunicator extends CachedFunctionalResponseCommunicator<InterproCode, InterproResponse> {
    constructor() {
        super(new InterproResponseCommunicator(), "SELECT * FROM interpro_entries WHERE `code` = ?", "IPR:");
    }

    protected convertToResponse(row: any): InterproResponse {
        if (row) {
            return {
                code: "IPR:" + row.code,
                name: row.name,
                category: row.category
            }
        }
        return undefined;
    }
}
