import {
    ProteomicsAssay,
    SearchConfiguration,
    PeptideTrust,
    PeptideData,
    PeptideDataSerializer
} from "unipept-web-components";

import ProcessedAssayResult from "@/logic/filesystem/assay/processed/ProcessedAssayResult";
import { Database } from "better-sqlite3";
import SearchConfigFileSystemReader from "@/logic/filesystem/configuration/SearchConfigFileSystemReader";
import { ShareableMap } from "shared-memory-datastructures";
import SearchConfigFileSystemWriter from "@/logic/filesystem/configuration/SearchConfigFileSystemWriter";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

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
        console.log("Reading in processed manager...");
        await serializedSearchConfig.accept(searchConfigReader);

        // Now check whether the search config is the same as the one that's currently assigned to this assay.
        const assayConfig = assay.getSearchConfiguration();
        if (
            serializedSearchConfig.equateIl !== assayConfig.equateIl ||
            serializedSearchConfig.filterDuplicates !== assayConfig.filterDuplicates ||
            serializedSearchConfig.enableMissingCleavageHandling !== assayConfig.enableMissingCleavageHandling
        ) {
            console.log("Config is different!");
            console.log(JSON.stringify(assayConfig));
            console.log(JSON.stringify(serializedSearchConfig));
            return null;
        }

        const dataRow = await this.dbManager.performQuery<any>((db: Database) => {
            return db.prepare("SELECT * FROM pept2data WHERE `assay_id` = ?").get(assay.getId());
        })

        if (!dataRow) {
            return null;
        }

        const indexBuffer = this.bufferToSharedArrayBuffer(dataRow.index_buffer);
        const dataBuffer = this.bufferToSharedArrayBuffer(dataRow.data_buffer);

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

        const sharedMap = new ShareableMap<string, PeptideData>(0, 0, new PeptideDataSerializer());
        sharedMap.setBuffers(
            indexBuffer,
            dataBuffer
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
        await this.dbManager.performQuery<void>((db: Database) => {
            db.prepare("DELETE FROM storage_metadata WHERE assay_id = ?").run(assay.getId())
        });

        // First try to write the pept2data information to the database.
        const buffers = pept2Data.getBuffers();
        await this.dbManager.performQuery<void>((db: Database) => {
            // First delete all existing rows for this assay;
            db.prepare("DELETE FROM pept2data WHERE `assay_id` = ?").run(assay.getId());
            db.prepare("DELETE FROM peptide_trust WHERE `assay_id` = ?").run(assay.getId());

            db.prepare("INSERT INTO pept2data VALUES (?, ?, ?)").run(
                assay.getId(),
                this.arrayBufferToBuffer(buffers[0]),
                this.arrayBufferToBuffer(buffers[1])
            );

            const insertTrust = db.prepare("INSERT INTO peptide_trust VALUES (?, ?, ?, ?)");
            insertTrust.run(
                assay.getId(),
                JSON.stringify(trust.missedPeptides),
                trust.matchedPeptides,
                trust.searchedPeptides
            );
        });

        // Now write the metadata to the database again.
        const existingConfig = assay.getSearchConfiguration();
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
}
