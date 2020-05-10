import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import EcResponseCommunicator from "unipept-web-components/src/business/communication/functional/ec/EcResponseCommunicator";
import GoResponseCommunicator from "unipept-web-components/src/business/communication/functional/go/GoResponseCommunicator";
import InterproResponseCommunicator from "unipept-web-components/src/business/communication/functional/interpro/InterproResponseCommunicator";
import NcbiResponseCommunicator from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponseCommunicator";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import { EcResponse } from "unipept-web-components/src/business/communication/functional/ec/EcResponse";
import { EcCode } from "unipept-web-components/src/business/ontology/functional/ec/EcDefinition";
import { GoCode } from "unipept-web-components/src/business/ontology/functional/go/GoDefinition";
import { GoResponse } from "unipept-web-components/src/business/communication/functional/go/GoResponse";
import InterproResponse from "unipept-web-components/src/business/communication/functional/interpro/InterproResponse";
import { InterproCode } from "unipept-web-components/src/business/ontology/functional/interpro/InterproDefinition";
import NcbiResponse from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponse";
import NcbiTaxon, { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { PeptideDataResponse } from "unipept-web-components/src/business/communication/peptides/PeptideDataResponse";
import CachedFunctionalResponseCommunicator
    from "@/logic/communication/functional/CachedFunctionalResponseCommunicator";
import CachedPept2DataCommunicator from "@/logic/communication/raw/CachedPept2DataCommunicator";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";

export default class CachedCommunicationSource implements CommunicationSource {
    private ecCommunicator: EcResponseCommunicator;
    private goCommunicator: GoResponseCommunicator;
    private iprCommunicator: InterproResponseCommunicator;
    private ncbiCommunicator: NcbiResponseCommunicator;
    private pept2DataCommunicator: Pept2DataCommunicator;

    constructor(
        ecToResponseMap: Map<EcCode, EcResponse>,
        goToResponseMap: Map<GoCode, GoResponse>,
        iprToResponseMap: Map<InterproCode, InterproResponse>,
        ncbiToResponseMap: Map<NcbiId, NcbiResponse>,
        peptToResponseMap: Map<Peptide, PeptideDataResponse>,
        peptideTrust: PeptideTrust,
        initialConfiguration: SearchConfiguration
    ) {
        this.ecCommunicator = new CachedFunctionalResponseCommunicator<EcCode, EcResponse>(ecToResponseMap);
        this.goCommunicator = new CachedFunctionalResponseCommunicator<GoCode, GoResponse>(goToResponseMap);
        this.iprCommunicator = new CachedFunctionalResponseCommunicator<InterproCode, InterproResponse>(iprToResponseMap);
        this.pept2DataCommunicator = new CachedPept2DataCommunicator(peptToResponseMap, peptideTrust, initialConfiguration);
        this.ncbiCommunicator = new CachedNcbiResponseCommunicator(ncbiToResponseMap);
    }

    public getEcCommunicator(): EcResponseCommunicator {
        return this.ecCommunicator;
    }

    public getGoCommunicator(): GoResponseCommunicator {
        return this.goCommunicator;
    }

    public getInterproCommunicator(): InterproResponseCommunicator {
        return this.iprCommunicator;
    }

    public getNcbiCommunicator(): NcbiResponseCommunicator {
        return this.ncbiCommunicator;
    }

    public getPept2DataCommunicator(): Pept2DataCommunicator {
        return this.pept2DataCommunicator;
    }
}
