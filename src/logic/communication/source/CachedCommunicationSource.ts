import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import EcResponseCommunicator from "unipept-web-components/src/business/communication/functional/ec/EcResponseCommunicator";
import GoResponseCommunicator from "unipept-web-components/src/business/communication/functional/go/GoResponseCommunicator";
import InterproResponseCommunicator from "unipept-web-components/src/business/communication/functional/interpro/InterproResponseCommunicator";
import NcbiResponseCommunicator from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponseCommunicator";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { PeptideDataResponse } from "unipept-web-components/src/business/communication/peptides/PeptideDataResponse";
import CachedPept2DataCommunicator from "@/logic/communication/raw/CachedPept2DataCommunicator";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import CachedEcResponseCommunicator from "@/logic/communication/functional/CachedEcResponseCommunicator";
import CachedGoResponseCommunicator from "@/logic/communication/functional/CachedGoResponseCommunicator";
import CachedInterproResponseCommunicator from "@/logic/communication/functional/CachedInterproResponseCommunicator";

export default class CachedCommunicationSource implements CommunicationSource {
    private readonly ecCommunicator: EcResponseCommunicator;
    private readonly goCommunicator: GoResponseCommunicator;
    private readonly iprCommunicator: InterproResponseCommunicator;
    private readonly ncbiCommunicator: NcbiResponseCommunicator;
    private readonly pept2DataCommunicator: Pept2DataCommunicator;

    constructor(
        peptToResponseMap: Map<Peptide, string>,
        peptideTrust: PeptideTrust,
        initialConfiguration: SearchConfiguration
    ) {
        this.ecCommunicator = new CachedEcResponseCommunicator();
        this.goCommunicator = new CachedGoResponseCommunicator();
        this.iprCommunicator = new CachedInterproResponseCommunicator();
        this.ncbiCommunicator = new CachedNcbiResponseCommunicator();
        this.pept2DataCommunicator = new CachedPept2DataCommunicator(peptToResponseMap, peptideTrust, initialConfiguration);
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
