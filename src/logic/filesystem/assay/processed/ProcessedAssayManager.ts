
import {
    ProteomicsAssay,
    SearchConfiguration,
    PeptideTrust,
    PeptideData,
    PeptideDataSerializer, NetworkConfiguration, DateUtils
} from "unipept-web-components";

import ProcessedAssayResult from "@/logic/filesystem/assay/processed/ProcessedAssayResult";
import { Database } from "better-sqlite3";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";
import { spawn, TransferDescriptor, Worker } from "threads/dist";
import { ShareableMap } from "shared-memory-datastructures";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import MetadataCommunicator from "@/logic/communication/metadata/MetadataCommunicator";

export default class ProcessedAssayManager {
    private static worker: any;

    constructor(
        private readonly db: Database,
        private readonly dbFile: string
    ) {}

    /**
     * Looks up the given assay in the database with all serialized processing results and returns the deserialized
     * results if they are available. If no data is available for the assay, null will be returned.
     *
     * @param assay The assay for which the deserialized results should be returned.
     */
    public async readProcessingResults(assay: ProteomicsAssay): Promise<ProcessedAssayResult | null> {
        if (!ProcessedAssayManager.worker) {
            ProcessedAssayManager.worker = await spawn(new Worker("./ProcessedAssayManager.worker.ts"));
        }

        // Look up whether storage metadata with the given properties is present in the database.
        const row = this.db.prepare("SELECT * FROM storage_metadata WHERE assay_id = ?").get(assay.getId());

        if (!row) {
            return null;
        }

        const serializedSearchConfig = new SearchConfiguration(
            true,
            true,
            false,
            row.configuration_id
        );
        const searchConfigReader = new SearchConfigFileSystemReader(this.db);
        await serializedSearchConfig.accept(searchConfigReader);

        // Now check whether the search config is the same as the one that's currently assigned to this assay.
        const assayConfig = assay.getSearchConfiguration();
        if (
            serializedSearchConfig.equateIl !== assayConfig.equateIl ||
            serializedSearchConfig.filterDuplicates !== assayConfig.filterDuplicates ||
            serializedSearchConfig.enableMissingCleavageHandling !== assayConfig.enableMissingCleavageHandling
        ) {
            return null;
        }

        // Now try to read the serialized pept2data from the database
        const result: [
            TransferDescriptor,
            TransferDescriptor,
            PeptideTrust
        ] | null = await ProcessedAssayManager.worker.readPept2Data(
            __dirname,
            this.dbFile,
            assay.getId()
        )

        if (!result) {
            return null;
        }

        const [indexBuffer, dataBuffer, trust] = result;
        const sharedMap = new ShareableMap<string, PeptideData>(0, 0, new PeptideDataSerializer());
        sharedMap.setBuffers(
            indexBuffer.transferables[0] as SharedArrayBuffer,
            dataBuffer.transferables[0] as SharedArrayBuffer
        );

        return new ProcessedAssayResult(
            assay.getEndpoint(),
            assay.getDatabaseVersion(),
            serializedSearchConfig,
            // @ts-ignore
            sharedMap,
            trust
        );
    }

    public async storeProcessingResults(
        assay: ProteomicsAssay,
        pept2Data: ShareableMap<string, PeptideData>,
        trust: PeptideTrust
    ) {
        // Delete the metadata that's associated with this assay
        this.db.prepare("DELETE FROM storage_metadata WHERE assay_id = ?").run(assay.getId());

        // First try to write the pept2data information to the database.
        const buffers = pept2Data.getBuffers();
        await ProcessedAssayManager.worker.writePept2Data(
            __dirname,
            buffers[0],
            buffers[1],
            trust,
            assay.getId(),
            this.dbFile
        );

        // Now write the metadata to the database again.
        const existingConfig = assay.getSearchConfiguration();
        const searchConfiguration = new SearchConfiguration(
            existingConfig.equateIl,
            existingConfig.filterDuplicates,
            existingConfig.enableMissingCleavageHandling
        );

        const searchConfigWriter = new SearchConfigFileSystemWriter(this.db);
        searchConfigWriter.visitSearchConfiguration(searchConfiguration);

        this.db.prepare("INSERT INTO storage_metadata VALUES (?, ?, ?, ?, ?)").run(
            assay.getId(),
            searchConfiguration.id,
            assay.getEndpoint(),
            assay.getDatabaseVersion(),
            assay.getDate().toJSON()
        );
    }
}
