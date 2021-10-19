import {
    ProteomicsAssay,
    SearchConfiguration,
    PeptideTrust,
    PeptideData,
    PeptideDataSerializer,
    Assay,
    AnalysisSource, Peptide
} from "unipept-web-components";

import CachedAssayData from "@/logic/filesystem/assay/processed/CachedAssayData";
import { Database } from "better-sqlite3";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";
import { ShareableMap } from "shared-memory-datastructures";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

import { promises as fs } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import crypto from "crypto";
import AnalysisSourceSerializer from "@/logic/filesystem/analysis/AnalysisSourceSerializer";

export default class CachedResultsManager {
    constructor(
        private readonly dbManager: DatabaseManager,
        private readonly projectLocation: string
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
        const row = await this.dbManager.performQuery<any>((db: Database) => {
            return db.prepare("SELECT * FROM storage_metadata WHERE assay_id = ?").get(assay.getId());
        });

        // First, check if metadata for this assay is present in the database.
        if (!row) {
            return false;
        }

        // Second, check if the current search configuration is identical to the one used for the offline analysis.
        const serializedSearchConfig = new SearchConfiguration(
            true,
            true,
            false,
            row.configuration_id
        );
        const searchConfigReader = new SearchConfigFileSystemReader(this.dbManager);
        await serializedSearchConfig.accept(searchConfigReader);

        const assayConfig = assay.getSearchConfiguration();
        if (
            serializedSearchConfig.equateIl !== assayConfig.equateIl ||
            serializedSearchConfig.filterDuplicates !== assayConfig.filterDuplicates ||
            serializedSearchConfig.enableMissingCleavageHandling !== assayConfig.enableMissingCleavageHandling
        ) {
            return false;
        }

        // Third, check if the fingerprint of the stored AnalysisSource is the same as the current AnalysisSource.
        const fingerprint = row.fingerprint;
        if (!(await assay.getAnalysisSource().verifyEquality(fingerprint))) {
            return false;
        }

        // Fourth, check if the peptide trust is available in the database.
        const trustRow = await this.dbManager.performQuery<any>((db: Database) => {
            return db.prepare("SELECT * FROM peptide_trust WHERE `assay_id` = ?").get(assay.getId());
        })

        if (!trustRow) {
            return false;
        }

        // Finally, check if the integrity hash of the local data files corresponds to the hash that was stored
        // alongside in the database.
        const computedHash = await this.computeDataHash(assay);
        return computedHash === row.data_hash;
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

        const trustRow = await this.dbManager.performQuery<any>((db: Database) => {
            return db.prepare("SELECT * FROM peptide_trust WHERE `assay_id` = ?").get(assay.getId());
        });

        const trust = new PeptideTrust(
            JSON.parse(trustRow.missed_peptides),
            trustRow.matched_peptides,
            trustRow.searched_peptides
        );

        return new CachedAssayData(
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
            db.prepare("INSERT INTO storage_metadata VALUES (?, ?, ?, ?, ?, ?)").run(
                assay.getId(),
                searchConfiguration.id,
                AnalysisSourceSerializer.serializeAnalysisSource(assay.getAnalysisSource()),
                assay.getAnalysisSource().computeFingerprint(),
                this.computeDataHash(assay),
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
            const indexBuffer = this.bufferToSharedArrayBuffer(await fs.readFile(indexBufferPath));
            const dataBuffer = this.bufferToSharedArrayBuffer(await fs.readFile(dataBufferPath));

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
