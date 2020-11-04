import {
    CountTable,
    Peptide,
    SearchConfiguration,
    ProgressListener,
    PeptideTrust,
    Pept2DataCommunicator,
    PeptideData
} from "unipept-web-components";

import { ShareableMap } from "shared-memory-datastructures";


/**
 * A cached variant of the Pept2DataCommunicator that persistently stores the results in the SQLite-database associated
 * with a specific project. This way all communication performed to analyse an assay does not need to be repeated when
 * restarting the application.
 *
 * @author Pieter Verschaffelt
 */
export default class CachedPept2DataCommunicator extends Pept2DataCommunicator {
    constructor(
        private readonly peptideToResponse: ShareableMap<string, PeptideData>,
        private readonly peptideTrust: PeptideTrust,
        private readonly initialConfiguration: SearchConfiguration
    ) {
        super();
    }

    public async process(
        countTable: CountTable<Peptide>,
        configuration: SearchConfiguration,
        progressListener?: ProgressListener
    ): Promise<void> {
        // Does not need to do anything as this processor
        return;
    }

    public async getPeptideTrust(
        countTable: CountTable<Peptide>,
        configuration: SearchConfiguration
    ): Promise<PeptideTrust> {
        if (configuration.toString() !== this.initialConfiguration.toString()) {
            throw "Communicator was configured with different configuration!";
        }
        return this.peptideTrust;
    }

    public getPeptideResponse(peptide: string, configuration: SearchConfiguration): PeptideData  {
        if (configuration.toString() !== this.initialConfiguration.toString()) {
            throw "Communicator was configured with different configuration!";
        }
        return this.peptideToResponse.get(peptide);
    }

    // @ts-ignore
    public getPeptideResponseMap(configuration: SearchConfiguration): ShareableMap<Peptide, PeptideData> {
        if (configuration.toString() !== this.initialConfiguration.toString()) {
            throw "Communicator was configured with different configuration!";
        }
        return this.peptideToResponse;
    }
}
