import {
    ProteomicsAssay,
    SearchConfiguration,
    PeptideTrust,
    PeptideData,
    PeptideDataSerializer,
    Assay,
    AnalysisSource,
    Peptide
} from "unipept-web-components";

import CachedAssayData from "@/logic/filesystem/assay/processed/CachedAssayData";
import { Database } from "better-sqlite3";
import { ShareableMap } from "shared-memory-datastructures";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

import { promises as fs } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import crypto from "crypto";
import AnalysisSourceSerializer from "@/logic/filesystem/analysis/AnalysisSourceSerializer";
import SearchConfigManager from "@/logic/filesystem/configuration/SearchConfigManager";
import StorageMetadataManager from "@/logic/filesystem/metadata/StorageMetadataManager";
import StorageMetadata from "@/logic/filesystem/metadata/StorageMetadata";
import PeptideTrustManager from "@/logic/filesystem/trust/PeptideTrustManager";
import BufferUtils from "@/logic/filesystem/BufferUtils";
import AnalysisSourceManager from "@/logic/filesystem/analysis/AnalysisSourceManager";
import { Store } from "vuex";
import { StorageMetadataTableRow } from "@/logic/filesystem/database/Schema";

export default class CachedResultsManager {
    constructor(
        private readonly dbManager: DatabaseManager,
        private readonly projectLocation: string,
        private readonly store: Store<any>
    ) {}

    /**
     * Checks, for the given assay, if analysis results are available and valid in the cache. The cache results are
     * valid if the search configuration for the stored results is the same as the configuration of the provided assay
     * and if the cache_valid_bit has been set to 1 (which means that the storage of the results correctly finished
     * last time).
     *
     * @param assay The assay for which should be checked if the results are available and valid in this project's
     * cache.
     */
    public async verifyCacheIntegrity(assay: ProteomicsAssay): Promise<boolean> {
        const storageMng = new StorageMetadataManager(this.dbManager, this.projectLocation, this.store);
        const storageMetadata = await storageMng.readMetadata(assay);

        // First, check if metadata for this assay is present in the database.
        if (!storageMetadata) {
            return false;
        }

        // Second, check if the current search configuration is identical to the one used for the offline analysis.
        const serializedSearchConfig = storageMetadata.searchConfiguration;

        const assayConfig = assay.getSearchConfiguration();
        if (
            serializedSearchConfig.equateIl !== assayConfig.equateIl ||
            serializedSearchConfig.filterDuplicates !== assayConfig.filterDuplicates ||
            serializedSearchConfig.enableMissingCleavageHandling !== assayConfig.enableMissingCleavageHandling
        ) {
            return false;
        }

        // Third, check if the stored AnalysisSource is the same as the current AnalysisSource.

        const assaySource = assay.getAnalysisSource();
        const storageSource = storageMetadata.analysisSource;

        const storageFingerprint = await storageSource.computeFingerprint();

        if (!(await assaySource.verifyEquality(storageFingerprint))) {
            return false;
        }

        // Fourth, check if the peptide trust is available in the database.
        const trustManager = new PeptideTrustManager(this.dbManager);
        const peptideTrust = await trustManager.readTrust(assay.getId());

        if (!peptideTrust) {
            return false;
        }

        // Finally, check if the integrity hash of the local data files corresponds to the hash that was stored
        // alongside in the database.
        const computedHash = await this.computeDataHash(assay);
        return computedHash === storageMetadata.dataHash;
    }

    /**
     * Compute the hash for the local stored analysis results of this assay. The hash is computed over both the data
     * and index buffer files (the result is a concatenation of the sha256 of both these files).
     *
     * @param assay The assay for which we should compute the integrity hash of the
     */
    public async computeDataHash(assay: ProteomicsAssay): Promise<string> {
        const dataHash = crypto.createHash("sha256");

        const dataBuffer = await fs.readFile(this.getDataBufferPath(assay));
        dataHash.update(dataBuffer);

        const dataHex = dataHash.digest("hex");

        const indexHash = crypto.createHash("sha256");

        const indexBuffer = await fs.readFile(this.getIndexBufferPath(assay));
        indexHash.update(indexBuffer);

        const indexHex = indexHash.digest("hex");

        return dataHex + indexHex;
    }

    /**
     * Looks up the given assay in the database with all serialized processing results and returns the deserialized
     * results if they are available. If no data is available for the assay, null will be returned.
     *
     * @param assay The assay for which the deserialized results should be returned.
     */
    public async readProcessingResults(assay: ProteomicsAssay): Promise<CachedAssayData | null> {
        if (!(await this.verifyCacheIntegrity(assay))) {
            return null;
        }

        const sharedMap = await this.readShareableMap(assay);

        if (!sharedMap) {
            return null;
        }

        const trustMng = new PeptideTrustManager(this.dbManager);
        const trust = await trustMng.readTrust(assay.getId());

        return new CachedAssayData(
            sharedMap,
            trust
        );
    }

    public async storeProcessingResults(
        assay: ProteomicsAssay,
        pept2Data: ShareableMap<Peptide, PeptideData>,
        trust: PeptideTrust,
        searchSettings: SearchConfiguration
    ) {
        // Delete the metadata that's associated with this assay
        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare("DELETE FROM storage_metadata WHERE assay_id = ?").run(assay.getId())
        });

        // Write both buffers to a binary file.
        await this.writeShareableMap(assay, pept2Data);

        // Now write the metadata to the database again.
        const existingConfig = searchSettings;
        const searchConfiguration = new SearchConfiguration(
            existingConfig.equateIl,
            existingConfig.filterDuplicates,
            existingConfig.enableMissingCleavageHandling
        );

        const searchConfigManager = new SearchConfigManager(this.dbManager);
        searchConfigManager.writeSearchConfig(searchConfiguration);

        const trustMng = new PeptideTrustManager(this.dbManager);
        await trustMng.writeTrust(assay.getId(), trust);

        const storageMetaManager = new StorageMetadataManager(this.dbManager);
        await storageMetaManager.writeMetadata(new StorageMetadata(
            assay.getId(),
            searchConfiguration,
            AnalysisSourceSerializer.serializeAnalysisSource(assay.getAnalysisSource()),
            await assay.getAnalysisSource().computeFingerprint(),
            await this.computeDataHash(assay),
            assay.getDate()
        ));
    }

    /**
     * Remove the processing results that might have been stored for a specific assay from the project folder.
     *
     * @param assay The assay for which previously created processing results should be deleted.
     */
    public async deleteProcessingResults(assay: ProteomicsAssay): Promise<void> {
        const idxBufferPath = this.getIndexBufferPath(assay);
        const dataBufferPath = this.getDataBufferPath(assay);

        try {
            await fs.unlink(idxBufferPath);
            await fs.unlink(dataBufferPath);
        } catch (err) {
            // This means that the files we are trying to delete do no longer exist and should thus not be an issue.
        }
    }

    /**
     * Write the given assay and the corresponding data to the filesystem.
     *
     * @param assay
     * @param pept2Data
     * @private
     */
    private async writeShareableMap(assay: ProteomicsAssay, pept2Data: ShareableMap<String, PeptideData>) {
        // Write both buffers to a binary file.
        const buffers: ArrayBuffer[] = pept2Data.getBuffers();

        const bufferDirectory = this.getBufferDirectory();
        await mkdirp(bufferDirectory);

        const indexBufferPath = this.getIndexBufferPath(assay);
        const dataBufferPath = this.getDataBufferPath(assay);

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

    private async readShareableMap(assay: ProteomicsAssay): Promise<ShareableMap<Peptide, PeptideData> | null> {
        const bufferDirectory = this.getBufferDirectory()
        await mkdirp(bufferDirectory);

        const indexBufferPath = this.getIndexBufferPath(assay);
        const dataBufferPath = this.getDataBufferPath(assay);

        try {
            const indexBuffer = BufferUtils.bufferToSharedArrayBuffer(await fs.readFile(indexBufferPath));
            const dataBuffer = BufferUtils.bufferToSharedArrayBuffer(await fs.readFile(dataBufferPath));

            const output = new ShareableMap<Peptide, PeptideData>(0, 0, new PeptideDataSerializer());
            output.setBuffers(indexBuffer, dataBuffer);

            return output;
        } catch (error) {
            console.error(error);

            // File's do not exist!
            return null;
        }
    }

    private getBufferDirectory(): string {
        return path.join(this.projectLocation, ".buffers");
    }

    private getDataBufferPath(assay: ProteomicsAssay): string {
        const bufferDirectory = this.getBufferDirectory();
        return path.join(bufferDirectory, assay.getId() + ".data");
    }

    private getIndexBufferPath(assay: ProteomicsAssay): string {
        const bufferDirectory = this.getBufferDirectory();
        return path.join(bufferDirectory, assay.getId() + ".index");
    }
}
