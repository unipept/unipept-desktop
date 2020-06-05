import ProgressListener from "unipept-web-components/src/business/progress/ProgressListener";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import PeptideCountTableProcessor from "unipept-web-components/src/business/processors/raw/PeptideCountTableProcessor";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import { Database, RunResult } from "better-sqlite3";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import { spawn, Transfer, Worker } from "threads/dist";
import { Observable } from "threads/observable";
import { ReadResult } from "@/logic/communication/AssayProcessor.worker";
import { ShareableMap } from "shared-memory-datastructures";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";

export default class AssayProcessor {
    private static worker;

    constructor(
        private readonly db: Database,
        private readonly dbFile: string,
        private readonly assay: ProteomicsAssay,
        private readonly progressListener?: ProgressListener
    ) {}

    public async processAssay(): Promise<[CountTable<Peptide>, CommunicationSource]> {
        if (!AssayProcessor.worker) {
            AssayProcessor.worker = await spawn(new Worker("./AssayProcessor.worker.ts"));
        }

        const peptideCountTableProcessor = new PeptideCountTableProcessor();
        const peptideCountTable = await peptideCountTableProcessor.getPeptideCountTable(
            this.assay.getPeptides(),
            this.assay.getSearchConfiguration()
        );

        const [pept2DataResponses, peptideTrust] = await this.getPept2Data(peptideCountTable);

        // Now update the storage metadata in the db
        await this.updateStorageMetadata();

        this.setProgress(1);
        console.log("Done loading: " + new Date().getTime());
        return [peptideCountTable, new CachedCommunicationSource(
            pept2DataResponses,
            peptideTrust,
            this.assay.getSearchConfiguration()
        )];
    }

    private async updateStorageMetadata(): Promise<void> {
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

    private async getPept2Data(peptideCountTable: CountTable<Peptide>): Promise<[Map<Peptide, string>, PeptideTrust]> {
        // Read storage metadata from db to check if a cache is present, and if is valid or not.
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

        if (valid) {
            // Read previous results from DB
            return await this.readPept2Data();
        } else {
            // Process assay and write results to database.
            const pept2DataProgressNotifier: ProgressListener = {
                onProgressUpdate: (val: number) => this.setProgress(val)
            }

            const pept2DataCommunicator = new Pept2DataCommunicator();
            await pept2DataCommunicator.process(
                peptideCountTable,
                this.assay.getSearchConfiguration(),
                pept2DataProgressNotifier
            );

            const pept2ResponseMap = pept2DataCommunicator.getPeptideResponseMap(this.assay.getSearchConfiguration());
            const trust = await pept2DataCommunicator.getPeptideTrust(peptideCountTable, this.assay.getSearchConfiguration());

            await this.writePept2Data(peptideCountTable, pept2ResponseMap, trust);

            return [
                pept2ResponseMap,
                trust
            ]
        }
    }

    private async readPept2Data(): Promise<[Map<Peptide, string>, PeptideTrust]> {
        const obs: Observable<ReadResult> = AssayProcessor.worker.readPept2Data(__dirname, this.dbFile, this.assay.getId());

        return new Promise<[ShareableMap<Peptide, string>, PeptideTrust]>((resolve, reject) => {
            obs.subscribe(message => {
                if (message.type === "progress") {
                    this.setProgress(message.value);
                } else {
                    const [indexBuffer, dataBuffer, peptideTrust] = message.value;
                    const sharedMap = new ShareableMap<string, string>(0);
                    sharedMap.setBuffers(
                        indexBuffer.transferables[0] as SharedArrayBuffer,
                        dataBuffer.transferables[0] as SharedArrayBuffer
                    );
                    resolve([sharedMap, peptideTrust]);
                }
            })
        });
    }

    private async writePept2Data(
        peptideCounts: CountTable<Peptide>,
        pept2DataResponses: ShareableMap<Peptide, string>,
        peptideTrust: PeptideTrust
    ) {
        const buffers = pept2DataResponses.getBuffers();
        await AssayProcessor.worker.writePept2Data(
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
