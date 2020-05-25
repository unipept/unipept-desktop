import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import ProgressListener from "unipept-web-components/src/business/progress/ProgressListener";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import { PeptideDataResponse } from "unipept-web-components/src/business/communication/peptides/PeptideDataResponse";
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
        private readonly peptideToResponse,
        private readonly peptideTrust,
        private readonly initialConfiguration
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
        if (configuration.toString() != this.initialConfiguration.toString()) {
            throw "Communicator was configured with different configuration!";
        }
        return this.peptideTrust;
    }

    public getPeptideResponse(peptide: string, configuration: SearchConfiguration): PeptideDataResponse {
        if (configuration.toString() != this.initialConfiguration.toString()) {
            throw "Communicator was configured with different configuration!";
        }
        const data = this.peptideToResponse.get(peptide);
        if (!data) {
            return;
        }
        return JSON.parse(data);
    }

    public getPeptideResponseMap(configuration: SearchConfiguration): ShareableMap<Peptide, string> {
        if (configuration.toString() != this.initialConfiguration.toString()) {
            throw "Communicator was configured with different configuration!";
        }
        return this.peptideToResponse;
    }
}
