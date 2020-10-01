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
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import MetadataCommunicator from "@/logic/communication/metadata/MetadataCommunicator";

export default class DesktopAssayProcessor implements AssayProcessor {
    private pept2DataCommunicator: Pept2DataCommunicator;
    private cancelled: boolean = false;

    constructor(
        private readonly db: Database,
        private readonly dbFile: string,
        private readonly assay: ProteomicsAssay,
        private readonly progressListener?: ProgressListener
    ) {}

    public async processAssay(countTable: CountTable<Peptide>): Promise<CommunicationSource> {
        const [pept2DataResponses, peptideTrust] = await this.getPept2Data(countTable);
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
        peptideCountTable: CountTable<Peptide>
    ): Promise<[ShareableMap<Peptide, PeptideData>, PeptideTrust]> {
        const processedAssayManager = new ProcessedAssayManager(this.db, this.dbFile);
        const processingResult = await processedAssayManager.readProcessingResults(this.assay);

        if (processingResult !== null) {
            return [processingResult.pept2DataMap, processingResult.peptideTrust];
        } else {
            // We need to reprocess this assay and store the results in the database.
            // Process assay and write results to database.
            const pept2DataProgressNotifier: ProgressListener = {
                onProgressUpdate: (val: number) => this.setProgress(val)
            }

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

                const currentDbVersion: string = await MetadataCommunicator.getRemoteUniprotVersion();

                this.assay.setEndpoint(NetworkConfiguration.BASE_URL);
                this.assay.setDatabaseVersion(currentDbVersion);

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
