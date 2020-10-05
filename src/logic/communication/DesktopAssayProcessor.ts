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
    DateUtils
} from "unipept-web-components";

import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import ProcessedAssayManager from "@/logic/filesystem/assay/processed/ProcessedAssayManager";
import { Database } from "better-sqlite3";
import { ShareableMap } from "shared-memory-datastructures";
import MetadataCommunicator from "@/logic/communication/metadata/MetadataCommunicator";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

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
        forceUpdate: boolean = false
    ): Promise<CommunicationSource> {
        const [pept2DataResponses, peptideTrust] = await this.getPept2Data(countTable, forceUpdate);
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
        forceUpdate: boolean
    ): Promise<[ShareableMap<Peptide, PeptideData>, PeptideTrust]> {
        const processedAssayManager = new ProcessedAssayManager(this.dbManager);
        const processingResult = await processedAssayManager.readProcessingResults(this.assay);

        if (processingResult !== null && !forceUpdate) {
            return [processingResult.pept2DataMap, processingResult.peptideTrust];
        } else {
            // We need to reprocess this assay and store the results in the database.
            // Process assay and write results to database.
            const pept2DataProgressNotifier: ProgressListener = {
                onProgressUpdate: (val: number) => this.setProgress(val)
            }

            // It's important that we keep track of the chosen settings before the analysis started. Otherwise the
            // metadata could be wrong if the user decides to switch endpoint mid-analysis.
            const currentDbVersion: string = await MetadataCommunicator.getRemoteUniprotVersion();
            const currentEndpoint: string = NetworkConfiguration.BASE_URL;

            this.pept2DataCommunicator = new Pept2DataCommunicator();

            await this.pept2DataCommunicator.process(
                peptideCountTable,
                this.assay.getSearchConfiguration(),
                pept2DataProgressNotifier
            );

            if (!this.cancelled) {
                const pept2ResponseMap = this.pept2DataCommunicator.getPeptideResponseMap(
                    this.assay.getSearchConfiguration()
                );
                const trust = await this.pept2DataCommunicator.getPeptideTrust(
                    peptideCountTable,
                    this.assay.getSearchConfiguration()
                );

                this.assay.setEndpoint(currentEndpoint);
                this.assay.setDatabaseVersion(currentDbVersion);
                this.assay.setDate(new Date());

                // Store results and update metadata...
                await processedAssayManager.storeProcessingResults(this.assay, pept2ResponseMap, trust);

                return [
                    pept2ResponseMap,
                    trust
                ];
            } else {
                return [undefined, undefined];
            }
        }
    }

    private setProgress(value: number) {
        if (this.progressListener) {
            this.progressListener.onProgressUpdate(value);
        }
    }
}
