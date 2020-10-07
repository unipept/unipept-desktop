import {
    CommunicationSource,
    EcResponseCommunicator,
    GoResponseCommunicator,
    InterproResponseCommunicator,
    NcbiResponseCommunicator,
    Pept2DataCommunicator
} from "unipept-web-components";

export default class ConfigureableCommunicationSource implements CommunicationSource {
    constructor(
        private readonly pept2DataCommunicator: Pept2DataCommunicator,
        private readonly goCommunicator: GoResponseCommunicator,
        private readonly ecCommunicator: EcResponseCommunicator,
        private readonly interproCommunicator: InterproResponseCommunicator,
        private readonly ncbiCommunicator: NcbiResponseCommunicator
    ) {}


    public getEcCommunicator(): EcResponseCommunicator {
        return this.ecCommunicator;
    }

    public getGoCommunicator(): GoResponseCommunicator {
        return this.goCommunicator;
    }

    public getInterproCommunicator(): InterproResponseCommunicator {
        return this.interproCommunicator;
    }

    public getNcbiCommunicator(): NcbiResponseCommunicator {
        return this.ncbiCommunicator;
    }

    public getPept2DataCommunicator(): Pept2DataCommunicator {
        return this.pept2DataCommunicator;
    }

}
