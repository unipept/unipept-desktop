import ProgressListener from "unipept-web-components/src/business/progress/ProgressListener";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import PeptideCountTableProcessor from "unipept-web-components/src/business/processors/raw/PeptideCountTableProcessor";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import GoResponseCommunicator from "unipept-web-components/src/business/communication/functional/go/GoResponseCommunicator";
import EcResponseCommunicator from "unipept-web-components/src/business/communication/functional/ec/EcResponseCommunicator";
import InterproResponseCommunicator from "unipept-web-components/src/business/communication/functional/interpro/InterproResponseCommunicator";
import NcbiResponseCommunicator from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponseCommunicator";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import { Database } from "better-sqlite3";
import { PeptideDataResponse } from "unipept-web-components/src/business/communication/peptides/PeptideDataResponse";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import { spawn, Worker } from "threads/dist";

export default class AssayProcessor {
    constructor(
        private readonly db: Database,
        private readonly dbFile: string,
        private readonly assay: ProteomicsAssay,
        private readonly progressListener?: ProgressListener
    ) {}

    public async processAssay(): Promise<[CountTable<Peptide>, CommunicationSource]> {
        const peptideCountTableProcessor = new PeptideCountTableProcessor();
        const peptideCountTable = await peptideCountTableProcessor.getPeptideCountTable(
            this.assay.getPeptides(),
            this.assay.getSearchConfiguration()
        );

        const [pept2DataResponses, peptideTrust] = await this.getPept2Data(peptideCountTable);

        const start = new Date().getTime();
        // Now we have to extract all functional annotations and NCBI-taxons from the received responses and preload
        // these as well...
        const spawnStart = new Date().getTime();
        const extractorWorker = await spawn(new Worker("./AssayProcessor.worker.ts"));
        console.log("Spawning took " + (new Date().getTime() - spawnStart) / 1000 + "s");
        const [gos, ecs, iprs, ncbis] = await extractorWorker.extractAnnotations(
            peptideCountTable.toMap(),
            pept2DataResponses
        );

        const end = new Date().getTime();
        console.log("Extracting fa's took " + (end - start) / 1000 + "s");

        // Now preload all the extracted annotations using the respective communicators
        const goCommunicator = new GoResponseCommunicator();
        const ecCommunicator = new EcResponseCommunicator();
        const iprCommunicator = new InterproResponseCommunicator();
        const ncbiCommunicator = new NcbiResponseCommunicator();

        await goCommunicator.process(gos);
        this.setProgress(0.7);
        await ecCommunicator.process(ecs);
        this.setProgress(0.8);
        await iprCommunicator.process(iprs);
        this.setProgress(0.9);
        await ncbiCommunicator.process(ncbis);
        this.setProgress(1);

        // Now update the storage metadata in the db
        await this.updateStorageMetadata();

        return [peptideCountTable, new CachedCommunicationSource(
            ecCommunicator.getResponseMap(),
            goCommunicator.getResponseMap(),
            iprCommunicator.getResponseMap(),
            ncbiCommunicator.getResponseMap(),
            pept2DataResponses,
            peptideTrust,
            this.assay.getSearchConfiguration()
        )];
    }

    private async updateStorageMetadata(): Promise<void> {
        const assayRow = this.db.prepare("SELECT * FROM assays WHERE `id` = ?").get(this.assay.getId());
        const metadataRow = this.db.prepare("SELECT * FROM storage_metadata WHERE `assay_id` = ?").get(
            this.assay.getId()
        );

        // Is there already metadata present in the DB?
        if (metadataRow) {
            // Update the db
            const update = this.db.prepare("UPDATE storage_metadata SET configuration_id = ? WHERE `assay_id` = ?");
            update.run(assayRow.configuration_id, this.assay.getId());
        } else {
            // Insert new metadata in the db
            const insert = this.db.prepare("INSERT INTO storage_metadata VALUES (?, ? , ?, ?)");
            // TODO endpoint and db version are empty for the time being...
            insert.run(this.assay.getId(), assayRow.configuration_id, "", "");
        }
    }

    private async getPept2Data(peptideCountTable: CountTable<Peptide>): Promise<[Map<Peptide, PeptideDataResponse>, PeptideTrust]> {
        // Read storage metadata from db to check if a cache is present, and if is valid or not.
        const row = this.db.prepare("SELECT * FROM storage_metadata WHERE `assay_id` = ?").get(
            this.assay.getId()
        );
        let valid: boolean = row !== undefined;

        if (valid) {
            // Read previous results from DB
            return await this.readPept2Data();
        } else {
            // Process assay and write results to database.
            const pept2DataProgressNotifier: ProgressListener = {
                // We consider the Pept2Data-communication part as 60% of the total progress.
                onProgressUpdate: (progress: number) => this.setProgress(0.6 * progress)
            }

            console.log("Making a new communicator...");
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

    private async readPept2Data(): Promise<[Map<Peptide, PeptideDataResponse>, PeptideTrust]> {
        const worker = await spawn(new Worker("./AssayProcessor.worker.ts"));
        return await worker.readPept2Data(this.dbFile, this.assay.getId());
    }

    private async writePept2Data(peptideCounts: CountTable<Peptide>, pept2DataResponses: Map<Peptide, PeptideDataResponse>, peptideTrust: PeptideTrust) {
        const worker = await spawn(new Worker("./AssayProcessor.worker.ts"));
        await worker.writePept2Data(
            peptideCounts.toMap(),
            pept2DataResponses,
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
