import {
    CommunicationSource ,
    EcResponseCommunicator,
    GoResponseCommunicator,
    InterproResponseCommunicator,
    Pept2DataCommunicator,
    Peptide,
    PeptideTrust,
    SearchConfiguration,
    PeptideData,
    NcbiResponseCommunicator
} from "unipept-web-components";

import CachedPept2DataCommunicator from "@/logic/communication/peptides/CachedPept2DataCommunicator";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import CachedEcResponseCommunicator from "@/logic/communication/functional/CachedEcResponseCommunicator";
import CachedGoResponseCommunicator from "@/logic/communication/functional/CachedGoResponseCommunicator";
import CachedInterproResponseCommunicator from "@/logic/communication/functional/CachedInterproResponseCommunicator";

import { ShareableMap } from "shared-memory-datastructures";

export default class CachedCommunicationSource implements CommunicationSource {
    private readonly ecCommunicator: EcResponseCommunicator;
    private readonly goCommunicator: GoResponseCommunicator;
    private readonly iprCommunicator: InterproResponseCommunicator;
    private readonly ncbiCommunicator: NcbiResponseCommunicator;
    private readonly pept2DataCommunicator: Pept2DataCommunicator;

    constructor(
        peptToResponseMap: ShareableMap<Peptide, PeptideData>,
        peptideTrust: PeptideTrust,
        initialConfiguration: SearchConfiguration
    ) {
        this.ecCommunicator = new CachedEcResponseCommunicator();
        this.goCommunicator = new CachedGoResponseCommunicator();
        this.iprCommunicator = new CachedInterproResponseCommunicator();
        this.ncbiCommunicator = new CachedNcbiResponseCommunicator();
        // @ts-ignore
        this.pept2DataCommunicator = new CachedPept2DataCommunicator(
            peptToResponseMap,
            peptideTrust,
            initialConfiguration
        );
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
