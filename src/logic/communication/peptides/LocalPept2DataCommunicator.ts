import {
    CountTable,
    Pept2DataCommunicator,
    Peptide,
    PeptideData, PeptideTrust,
    ProgressListener,
    SearchConfiguration
} from "unipept-web-components";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import { ShareableMap } from "shared-memory-datastructures";

import path from "path";

/**
 * This is a specific implementation of the Pept2DataCommunicator that more-or-less serves as a proxy. It is responsible
 * for starting the Docker-service, connect to the associated server and retrieve all results when they are available.
 * (The items are retrieved in the same way as the original Pept2DataCommunicator, the only thing that is different is
 * the setup and connection process).
 *
 * @author Pieter Verschaffelt
 */
export default class LocalPept2DataCommunicator extends Pept2DataCommunicator {
    /**
     * @param customDatabase The database that should be used during the analysis of samples for this communicator.
     * @param customDatabaseLocation Root folder of where all the custom databases are stored on the user's system.
     */
    constructor(
        private readonly customDatabase: CustomDatabase,
        private readonly customDatabaseLocation: string
    ) {
        super(
            `${DockerCommunicator.WEB_COMPONENT_PUBLIC_URL}:${DockerCommunicator.WEB_COMPONENT_PUBLIC_PORT}`,
            // This cache key will be used to make sure that network requests in the cache are invalidated if the
            // database changes.
            customDatabase.getDatabaseHash()
        );
    }

    public async process(
        countTable: CountTable<Peptide>,
        configuration: SearchConfiguration,
        progressListener?: ProgressListener
    ): Promise<[ShareableMap<Peptide, PeptideData>, PeptideTrust]> {
        // Start up the web component of the web browser.
        const dockerCommunicator = new DockerCommunicator(this.customDatabaseLocation);

        // TODO: make use of this public port for connecting with the analysis service via HTTP.
        const publicPort = await dockerCommunicator.startDatabase(this.customDatabase);

        // @ts-ignore
        const result: [ShareableMap<Peptide, PeptideData>, PeptideTrust] = await super.process(
            countTable,
            configuration,
            progressListener
        );

        await dockerCommunicator.stopDatabase(this.customDatabase);

        return new Promise<[ShareableMap<Peptide, PeptideData>, PeptideTrust]>((resolve) => resolve(result));
    }
}
