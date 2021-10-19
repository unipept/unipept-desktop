import {
    CountTable,
    Pept2DataCommunicator,
    Peptide,
    PeptideData,
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
            `${DockerCommunicator.WEB_COMPONENT_PUBLIC_URL}/${DockerCommunicator.WEB_COMPONENT_PUBLIC_PORT}`
        );
    }

    public async process(
        countTable: CountTable<Peptide>,
        configuration: SearchConfiguration,
        progressListener?: ProgressListener
    ): Promise<ShareableMap<Peptide, PeptideData>> {
        // Start up the web component of the web browser.
        const dockerCommunicator = new DockerCommunicator();
        await dockerCommunicator.startDatabase(
            path.join(this.customDatabaseLocation, "databases", this.customDatabase.name)
        );
        await dockerCommunicator.startWebComponent();
        const result: ShareableMap<Peptide, PeptideData> = await super.process(
            countTable,
            configuration,
            progressListener
        );
        await dockerCommunicator.stopWebComponent();
        await dockerCommunicator.stopDatabase();

        return new Promise<ShareableMap<Peptide, PeptideData>>((resolve) => resolve(result));
    }
}
