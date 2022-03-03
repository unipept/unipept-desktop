import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import Configuration from "@/logic/configuration/Configuration";
import { NetworkConfiguration, QueueManager } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import { Store } from "vuex";
import CustomDatabaseManager from "@/logic/filesystem/docker/CustomDatabaseManager";

/**
 * This class provides functions that need to be run when the application is started. All steps that are necessary for
 * the proper functioning of this application should be performed in here.
 *
 * @author Pieter Verschaffelt
 */
export default class BootstrapApplication {
    constructor(
        private readonly store: Store<any>
    ) {}

    /**
     * Start and load the different components required for the application to function properly.
     */
    public async loadApplicationComponents(): Promise<void> {
        const config = await this.initializeConfiguration();
        this.initializeApi(config);
        this.initializeWorkers(config);
        this.initializeDocker(config);
        this.initializeCustomDatabases(config);
        this.initializeProcessing(config);
    }

    private async initializeConfiguration(): Promise<Configuration> {
        const configurationManager = new ConfigurationManager();
        return configurationManager.readConfiguration();
    }

    private initializeApi(config: Configuration): void {
        NetworkConfiguration.BASE_URL = "https://rick.ugent.be";

        // NetworkConfiguration.BASE_URL = config.apiSource;
        //
        // // Make sure that the old Unipept URL is no longer being used...
        // if (NetworkConfiguration.BASE_URL === "https://unipept.ugent.be") {
        //     NetworkConfiguration.BASE_URL = "https://api.unipept.ugent.be";
        // }

        NetworkConfiguration.PARALLEL_API_REQUESTS = config.maxParallelRequests;
    }

    private initializeWorkers(config: Configuration): void {
        QueueManager.initializeQueue(config.maxLongRunningTasks);
    }

    private initializeDocker(config: Configuration) {
        DockerCommunicator.initializeConnection(JSON.parse(config.dockerConfigurationSettings));
    }

    private async initializeCustomDatabases(config: Configuration): Promise<void> {
        const customDatabaseManager = new CustomDatabaseManager();

        const completeDbs = await customDatabaseManager.listAllBuildDatabases(config.customDbStorageLocation);
        this.store.dispatch("initializeReadyDatabases", completeDbs)

        const incompleteDbs = await customDatabaseManager.listAllIncompleteDatabases(config.customDbStorageLocation);
        this.store.dispatch("initializeQueue", [incompleteDbs, config]);
    }

    private initializeProcessing(config: Configuration): void {
        this.store.dispatch("initializeAssayQueue");
    }
}
