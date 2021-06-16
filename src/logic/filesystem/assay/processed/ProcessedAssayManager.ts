import {
    ProteomicsAssay,
    SearchConfiguration,
    PeptideTrust,
    PeptideData,
    PeptideDataSerializer, Assay
} from "unipept-web-components";

import ProcessedAssayResult from "@/logic/filesystem/assay/processed/ProcessedAssayResult";
import { Database } from "better-sqlite3";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";
import { ShareableMap } from "shared-memory-datastructures";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

import { promises as fs } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import { store } from "./../../../../main";

export default class ProcessedAssayManager {
    constructor(
        private readonly dbManager: DatabaseManager,
    ) {}

    /**
     * Looks up the given assay in the database with all serialized processing results and returns the deserialized
     * results if they are available. If no data is available for the assay, null will be returned.
     *
     * @param assay The assay for which the deserialized results should be returned.
     */
    public async readProcessingResults(assay: ProteomicsAssay): Promise<ProcessedAssayResult | null> {
        // Look up whether storage metadata with the given properties is present in the database.
        const row = await this.dbManager.performQuery<any>((db: Database) => {
            return db.prepare("SELECT * FROM storage_metadata WHERE assay_id = ?").get(assay.getId());
        });

        if (!row) {
            return null;
        }

        const serializedSearchConfig = new SearchConfiguration(
            true,
            true,
            false,
            row.configuration_id
        );
        const searchConfigReader = new SearchConfigFileSystemReader(this.dbManager);
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

        const sharedMap = await this.readShareableMap(assay);

        if (!sharedMap) {
            return null;
        }

        const trustRow = await this.dbManager.performQuery<any>((db: Database) => {
            return db.prepare("SELECT * FROM peptide_trust WHERE `assay_id` = ?").get(assay.getId());
        })

        if (!trustRow) {
            return null;
        }

        const trust = new PeptideTrust(
            JSON.parse(trustRow.missed_peptides),
            trustRow.matched_peptides,
            trustRow.searched_peptides
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
        trust: PeptideTrust,
        searchSettings: SearchConfiguration
    ) {
        // Delete the metadata that's associated with this assay
        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare("DELETE FROM storage_metadata WHERE assay_id = ?").run(assay.getId())
        });

        // Write both buffers to a binary file.
        await this.writeShareableMap(assay, pept2Data);

        await this.dbManager.performQuery<void>((db: Database) => {
            // First delete all existing rows for this assay;
            db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assay.getId());

            const insertTrust = db.prepare("INSERT INTO peptide_trust VALUES (?, ?, ?, ?)");
            insertTrust.run(
                assay.getId(),
                JSON.stringify(trust.missedPeptides),
                trust.matchedPeptides,
                trust.searchedPeptides
            );
        });

        // Now write the metadata to the database again.
        const existingConfig = searchSettings;
        const searchConfiguration = new SearchConfiguration(
            existingConfig.equateIl,
            existingConfig.filterDuplicates,
            existingConfig.enableMissingCleavageHandling
        );

        const searchConfigWriter = new SearchConfigFileSystemWriter(this.dbManager);
        searchConfigWriter.visitSearchConfiguration(searchConfiguration);

        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare("INSERT INTO storage_metadata VALUES (?, ?, ?, ?, ?)").run(
                assay.getId(),
                searchConfiguration.id,
                assay.getEndpoint(),
                assay.getDatabaseVersion(),
                assay.getDate().toJSON()
            );
        });
    }

    private arrayBufferToBuffer(buffer: ArrayBuffer): Buffer {
        return Buffer.from(buffer);
    }

    private bufferToSharedArrayBuffer(buf: Buffer): SharedArrayBuffer {
        const ab = new SharedArrayBuffer(buf.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }

    /**
     * Write the given assay and the corresponding data to the filesystem.
     *
     * @param assay
     * @param pept2Data
     * @private
     */
    private async writeShareableMap(assay: ProteomicsAssay, pept2Data: ShareableMap<String, PeptideData>) {
        // Filter dataset for peptides that only occur in this assay.
        const filteredDataset = new ShareableMap(undefined, undefined, new PeptideDataSerializer());
        for (const peptide of assay.getPeptides()) {
            const result = pept2Data.get(peptide);
            if (result) {
                filteredDataset.set(peptide, result);
            }
        }

        // Write both buffers to a binary file.
        const buffers: ArrayBuffer[] = filteredDataset.getBuffers();

        const bufferDirectory = path.join(store.getters.projectLocation, ".buffers");
        await mkdirp(bufferDirectory);

        const indexBufferPath = path.join(bufferDirectory, assay.getId() + ".index");
        const dataBufferPath = path.join(bufferDirectory, assay.getId() + ".data");

        try {
            // Remove previous versions of this file's persistent storage.
            await fs.unlink(indexBufferPath);
            await fs.unlink(dataBufferPath);
        } catch (error) {
            // Ignore (this throws an error if these files do not exist, which is not an issue here)
        }

        // Write new version of this file's buffer to file
        await fs.writeFile(indexBufferPath, Buffer.from(buffers[0]));
        await fs.writeFile(dataBufferPath, Buffer.from(buffers[1]));
    }

    private async readShareableMap(assay: ProteomicsAssay): Promise<ShareableMap<String, PeptideData> | null> {
        const bufferDirectory = path.join(store.getters.projectLocation, ".buffers");
        await mkdirp(bufferDirectory);

        const indexBufferPath = path.join(bufferDirectory, assay.getId() + ".index");
        const dataBufferPath = path.join(bufferDirectory, assay.getId() + ".data");

        try {
            const indexBuffer = this.bufferToSharedArrayBuffer(await fs.readFile(indexBufferPath));
            const dataBuffer = this.bufferToSharedArrayBuffer(await fs.readFile(dataBufferPath));

            const output = new ShareableMap<String, PeptideData>(0, 0, new PeptideDataSerializer());
            output.setBuffers(indexBuffer, dataBuffer);

            return output;
        } catch (error) {
            console.error(error);

            // File's do not exist!
            return null;
        }
    }
}
