import {
    CountTable,
    Pept2DataCommunicator,
    Peptide,
    PeptideData,
    PeptideTrust,
    ProgressListener,
    ProteomicsAssay,
    SearchConfiguration
} from "unipept-web-components";
import { ShareableMap } from "shared-memory-datastructures";
import CachedResultsManager from "@/logic/filesystem/assay/processed/CachedResultsManager";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import PeptideTrustManager from "@/logic/filesystem/trust/PeptideTrustManager";
import { Store } from "vuex";

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
        private readonly projectLocation: string,
        private readonly store: Store<any>
    ) {
        super(invalidCacheCommunicator.serviceUrl);
    }

    public async process(
        countTable: CountTable<Peptide>,
        configuration: SearchConfiguration,
        progressListener?: ProgressListener
    ): Promise<[ShareableMap<Peptide, PeptideData>, PeptideTrust]> {
        const cachedResultsManager = new CachedResultsManager(this.databaseMng, this.projectLocation, this.store);

        if (await cachedResultsManager.verifyCacheIntegrity(this.assay)) {
            const pept2data = (await cachedResultsManager.readProcessingResults(this.assay)).pept2DataMap;
            const trustMng = new PeptideTrustManager(this.databaseMng);
            const trust = await trustMng.readTrust(this.assay.getId());
            return [pept2data, trust];
        } else {
            // If the data is not yet present in the local database, we first compute it and then store the result
            // in the local database.
            // If a request fails, we wait for a minute, try again and hope that the internet connection is restored
            // during this period of time.
            let data: ShareableMap<string, any>;
            let trust: PeptideTrust;

            try {
                [data, trust] = await this.invalidCacheCommunicator.process(
                    countTable,
                    configuration,
                    progressListener
                );
            } catch (err) {
                // Wait for a minute, try again
                await new Promise<void>((resolve) => {
                    setTimeout(() => resolve(), 60 * 1000);
                });

                [data, trust] = await this.invalidCacheCommunicator.process(
                    countTable,
                    configuration,
                    progressListener
                );
            }

            const dataMng = new CachedResultsManager(this.databaseMng, this.projectLocation, this.store);

            // @ts-ignore
            dataMng.storeProcessingResults(
                this.assay,
                data,
                trust,
                this.assay.getSearchConfiguration()
            );

            return new Promise<[ShareableMap<Peptide, PeptideData>, PeptideTrust]>(resolve => resolve([data, trust]));
        }
    }
}
