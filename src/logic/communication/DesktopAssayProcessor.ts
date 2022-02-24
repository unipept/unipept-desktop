import {
    ProgressListener,
    CommunicationSource,
    ProteomicsAssay,
    Peptide,
    CountTable,
    Pept2DataCommunicator,
    PeptideTrust,
    AssayProcessor,
    PeptideData,
    NetworkConfiguration,
    SearchConfiguration
} from "unipept-web-components";

import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import { ShareableMap } from "shared-memory-datastructures";
import MetadataCommunicator from "@/logic/communication/metadata/MetadataCommunicator";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import CustomDatabaseManager from "@/logic/filesystem/docker/CustomDatabaseManager";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import path from "path";

export default class DesktopAssayProcessor implements AssayProcessor {
    private pept2DataCommunicator: Pept2DataCommunicator;
    private cancelled: boolean = false;

    constructor(
        private readonly dbManager: DatabaseManager,
        private readonly assay: ProteomicsAssay,
        private readonly progressListener?: ProgressListener
    ) {}

    public async processAssay(
        countTable: CountTable<Peptide>,
        forceUpdate: boolean = false,
        searchSettings: SearchConfiguration
    ): Promise<CommunicationSource> {
        const [pept2DataResponses, peptideTrust] = await this.getPept2Data(
            countTable,
            forceUpdate,
            searchSettings
        );
        this.setProgress(1);

        if (this.isCancelled()) {
            return undefined;
        } else {
            return new CachedCommunicationSource(
                pept2DataResponses,
                peptideTrust,
                this.assay.getSearchConfiguration()
            );
        }
    }

    public cancel() {
        this.cancelled = true;
        if (this.pept2DataCommunicator) {
            this.pept2DataCommunicator.cancel();
        }
    }

    public isCancelled(): boolean {
        return this.cancelled;
    }

    private async getPept2Data(
        peptideCountTable: CountTable<Peptide>,
        forceUpdate: boolean,
        searchSettings: SearchConfiguration
    ): Promise<[ShareableMap<Peptide, PeptideData>, PeptideTrust]> {
        return [undefined, undefined];

        // const processedAssayManager = new ProcessedAssayManager(this.dbManager);
        // const processingResult = await processedAssayManager.readProcessingResults(this.assay);
        //
        // if (processingResult !== null && !forceUpdate) {
        //     return [processingResult.pept2DataMap, processingResult.peptideTrust];
        // } else {
        //     // We need to reprocess this assay and store the results in the database.
        //     // Process assay and write results to database.
        //     const pept2DataProgressNotifier: ProgressListener = {
        //         onProgressUpdate: (val: number) => this.setProgress(val)
        //     }
        //
        //     if (this.assay.getEndpoint().startsWith("cdb://")) {
        //         // First, start the database container and then start up the web container (and make sure that the
        //         // base url points to the web container).
        //         const configManager = new ConfigurationManager();
        //         const config = await configManager.readConfiguration();
        //
        //         const dbName = this.assay.getEndpoint().replace("cdb://", "");
        //
        //         const dockerCommunicator = new DockerCommunicator();
        //         await dockerCommunicator.startDatabase(path.join(config.customDbStorageLocation, "databases", dbName));
        //
        //         await dockerCommunicator.startWebComponent();
        //
        //         NetworkConfiguration.BASE_URL = "http://localhost:3000/";
        //     } else {
        //         NetworkConfiguration.BASE_URL = "http://unipept.ugent.be/";
        //     }
        //
        //
        //     // It's important that we keep track of the chosen settings before the analysis started. Otherwise the
        //     // metadata could be wrong if the user decides to switch endpoint mid-analysis.
        //     const currentDbVersion: string = await MetadataCommunicator.getRemoteUniprotVersion();
        //     const currentEndpoint: string = NetworkConfiguration.BASE_URL;
        //
        //     this.pept2DataCommunicator = new Pept2DataCommunicator();
        //
        //     await this.pept2DataCommunicator.process(
        //         peptideCountTable,
        //         searchSettings,
        //         pept2DataProgressNotifier
        //     );
        //
        //     if (this.assay.getEndpoint().startsWith("cdb://")) {
        //         // We're done with retrieving the necessary information from our database containers. We should thus
        //         // stop these containers and continue with the analysis itself.
        //         const dockerCommunicator = new DockerCommunicator();
        //
        //         await dockerCommunicator.stopWebComponent();
        //         await dockerCommunicator.stopDatabase();
        //     }
        //
        //     if (!this.cancelled) {
        //         // @ts-ignore
        //         const pept2ResponseMap: ShareableMap<string, PeptideData> = this.pept2DataCommunicator.getPeptideResponseMap(
        //             searchSettings
        //         );
        //
        //         console.log("Getting peptide responses...");
        //
        //         const trust = await this.pept2DataCommunicator.getPeptideTrust(
        //             peptideCountTable,
        //             searchSettings
        //         );
        //
        //         this.assay.setEndpoint(currentEndpoint);
        //         this.assay.setDatabaseVersion(currentDbVersion);
        //         this.assay.setDate(new Date());
        //         this.assay.setSearchConfiguration(searchSettings);
        //
        //         // Store results and update metadata...
        //         await processedAssayManager.storeProcessingResults(this.assay, pept2ResponseMap, trust, searchSettings);
        //
        //         return [
        //             pept2ResponseMap,
        //             trust
        //         ];
        //     } else {
        //         return [undefined, undefined];
        //     }
        // }
    }

    private setProgress(value: number) {
        if (this.progressListener) {
            this.progressListener.onProgressUpdate(value);
        }
    }
}
