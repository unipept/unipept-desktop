import ProgressListener from "unipept-web-components/src/business/progress/ProgressListener";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import { Database } from "better-sqlite3";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import { spawn, Worker } from "threads/dist";
import { ShareableMap } from "shared-memory-datastructures";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";
import AssayProcessor from "unipept-web-components/src/business/processors/AssayProcessor";
import PeptideData from "unipept-web-components/src/business/communication/peptides/PeptideData";
import PeptideDataSerializer from "unipept-web-components/src/business/communication/peptides/PeptideDataSerializer";

export default class DesktopAssayProcessor implements AssayProcessor {
    private static worker;
    private pept2DataCommunicator: Pept2DataCommunicator;
    private cancelled: boolean = false;

    constructor(
        private readonly db: Database,
        private readonly dbFile: string,
        private readonly assay: ProteomicsAssay,
        private readonly progressListener?: ProgressListener
    ) {}

    public async processAssay(countTable: CountTable<Peptide>): Promise<CommunicationSource> {
        if (!DesktopAssayProcessor.worker) {
            DesktopAssayProcessor.worker = await spawn(new Worker("./AssayProcessor.worker.ts"));
        }

        const [pept2DataResponses, peptideTrust] = await this.getPept2Data(countTable);

        if (!this.isCancelled()) {
            // Now update the storage metadata in the db
            await this.updateStorageMetadata();

            this.setProgress(1);
            return new CachedCommunicationSource(
                pept2DataResponses,
                peptideTrust,
                this.assay.getSearchConfiguration()
            );
        } else {
            return undefined;
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

    private async updateStorageMetadata(): Promise<void> {
        console.log("Update storage metadata...");
        const metadataRow = this.db.prepare("SELECT * FROM storage_metadata WHERE `assay_id` = ?").get(
            this.assay.getId()
        );

        const existingConfig = this.assay.getSearchConfiguration();
        const searchConfiguration = new SearchConfiguration(
            existingConfig.equateIl,
            existingConfig.filterDuplicates,
            existingConfig.enableMissingCleavageHandling
        );

        const searchConfigWriter = new SearchConfigFileSystemWriter(this.db);
        searchConfigWriter.visitSearchConfiguration(searchConfiguration);

        // Is there already metadata present in the DB?
        if (metadataRow) {
            // Update the db
            const update = this.db.prepare("UPDATE storage_metadata SET configuration_id = ? WHERE `assay_id` = ?");
            update.run(searchConfiguration.id, this.assay.getId());
        } else {
            // Insert new metadata in the db
            const insert = this.db.prepare("INSERT INTO storage_metadata VALUES (?, ? , ?, ?)");
            // TODO endpoint and db version are empty for the time being...
            insert.run(this.assay.getId(), searchConfiguration.id, "", "");
        }
    }

    private async getPept2Data(peptideCountTable: CountTable<Peptide>): Promise<[Map<Peptide, PeptideData>, PeptideTrust]> {
        // Read storage metadata from db to check if a cache is present, and if it is valid or not.
        const row = this.db.prepare("SELECT * FROM storage_metadata WHERE `assay_id` = ?").get(
            this.assay.getId()
        );

        let valid: boolean;

        if (row) {
            const configReader = new SearchConfigFileSystemReader(this.db);
            const searchConfiguration = new SearchConfiguration(
                true,
                true,
                false,
                row.configuration_id
            );
            configReader.visitSearchConfiguration(searchConfiguration);

            valid = searchConfiguration.toString() === this.assay.getSearchConfiguration().toString();
        } else {
            valid = false;
        }

        if (this.cancelled) {
            return;
        }

        if (valid) {
            // Read previous results from DB
            return await this.readPept2Data();
        } else {
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
                const pept2ResponseMap = this.pept2DataCommunicator.getPeptideResponseMap(this.assay.getSearchConfiguration());
                const trust = await this.pept2DataCommunicator.getPeptideTrust(peptideCountTable, this.assay.getSearchConfiguration());

                await this.writePept2Data(peptideCountTable, pept2ResponseMap, trust);

                return [
                    pept2ResponseMap,
                    trust
                ];
            } else {
                return [undefined, undefined];
            }
        }
    }

    private async readPept2Data(): Promise<[Map<Peptide, PeptideData>, PeptideTrust]> {
        const start = new Date().getTime();
        const [indexBuffer, dataBuffer, peptideTrust] = await DesktopAssayProcessor.worker.readPept2Data(
            __dirname,
            this.dbFile,
            this.assay.getId()
        );

        console.log("Received buffers: " + new Date().getTime());
        const sharedMap = new ShareableMap<string, PeptideData>(0, 0, new PeptideDataSerializer());
        sharedMap.setBuffers(
            indexBuffer.transferables[0] as SharedArrayBuffer,
            dataBuffer.transferables[0] as SharedArrayBuffer
        );
        console.log("Reading worker total was: " + (new Date().getTime() - start) / 1000 + "s");
        return [sharedMap, peptideTrust];
    }

    private async writePept2Data(
        peptideCounts: CountTable<Peptide>,
        pept2DataResponses: ShareableMap<Peptide, PeptideData>,
        peptideTrust: PeptideTrust
    ) {
        const buffers = pept2DataResponses.getBuffers();
        await DesktopAssayProcessor.worker.writePept2Data(
            __dirname,
            peptideCounts.toMap(),
            buffers[0],
            buffers[1],
            peptideTrust,
            this.assay.getId(),
            this.dbFile
        );
    }

    private setProgress(value: number) {
        if (this.progressListener) {
            this.progressListener.onProgressUpdate(value);
        }
    }
}
