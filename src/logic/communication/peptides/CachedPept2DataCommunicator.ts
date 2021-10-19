import {
    CountTable,
    Pept2DataCommunicator,
    Peptide,
    PeptideData,
    ProgressListener,
    ProteomicsAssay, SearchConfiguration
} from "unipept-web-components";
import { ShareableMap } from "shared-memory-datastructures";
import CachedResultsManager from "@/logic/filesystem/assay/processed/CachedResultsManager";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

/**
 * Special type of Pept2DataCommunicator that will always first check if data for the given sample is present in the
 * project's cache. If that data *is* present and it is valid, it will be returned by the communicator. If it is not
 * present or the cache state is invalid (i.e. does not correspond to all of the current properties of the assay), it
 * will use the Pept2DataCommunicator that was passed in the constructor and retrieve the results through there.
 *
 * @author Pieter Verschaffelt
 */
export default class CachedPept2DataCommunicator extends Pept2DataCommunicator {
    constructor(
        private readonly assay: ProteomicsAssay,
        private readonly invalidCacheCommunicator: Pept2DataCommunicator,
        private readonly databaseMng: DatabaseManager,
        private readonly projectLocation: string
    ) {
        super(invalidCacheCommunicator.serviceUrl);
    }

    public async process(
        countTable: CountTable<Peptide>,
        configuration: SearchConfiguration,
        progressListener?: ProgressListener
    ): Promise<ShareableMap<Peptide, PeptideData>> {
        const cachedResultsManager = new CachedResultsManager(this.databaseMng, this.projectLocation);

        if (await cachedResultsManager.verifyCacheIntegrity(this.assay)) {
            return (await cachedResultsManager.readProcessingResults(this.assay)).pept2DataMap;
        } else {
            return this.invalidCacheCommunicator.process(countTable, configuration, progressListener);
        }
    }
}
