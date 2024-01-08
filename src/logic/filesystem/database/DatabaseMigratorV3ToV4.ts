import DatabaseMigrator from "@/logic/filesystem/database/DatabaseMigrator";
import Database from "better-sqlite3";
import { Peptide, PeptideData, PeptideDataResponse, PeptideDataSerializer, StringUtils } from "unipept-web-components";
import { ShareableMap } from "shared-memory-datastructures";
import path from "path";
import { promises as fs } from "fs";
import BufferUtils from "@/logic/filesystem/BufferUtils";
import crypto from "crypto";

/**
 * This migrator updates an existing database from version 3 to version 4. Only one important change was made in the
 * database between version 3 and 4 which has to do with the encoding of the PeptideData objects in the database.
 *
 * Previously, 28 NCBI-ranks were supported by the application for NCBI taxons. We have updated the ranks some time
 * ago such that only 27 of them still remain. The PeptideData-encoding therefore needs to be updated accordingly. In
 * order to make upgrades of this encoding easier in the future, a new version identifier has also been added to the
 * encoding (this was not present previously).
 *
 * @author Pieter Verschaffelt
 */
export default class DatabaseMigratorV3ToV4 implements DatabaseMigrator {
    constructor(private readonly projectLocation: string) {}

    public async upgrade(database: Database.Database): Promise<void> {
        for (const assayId of database.prepare("SELECT id FROM assays").all().map(o => o.id)) {
            /*
             * The following steps need to be performed to upgrade the database encoding:
             * 1) Read in the current buffer from disk
             * 2) Convert the buffer to a ShareableMap using the previous encoding serializer (PeptideDataV0)
             * 3) Construct a new ShareableMap with the new encoding for each of the peptides.
             * 4) Write this new map to disk.
             * 5) Compute new data hash for these new data files and update it in the database.
             */

            // First read in the current buffers from disk.
            const [indexBuffer, dataBuffer] = await this.readFromDisk(assayId);

            // Convert the read buffers to a ShareableMap (with the old encoding and serializer).
            const map = new ShareableMap<Peptide, PeptideDataV0>(undefined, undefined, new PeptideDataV0Serializer());
            map.setBuffers(indexBuffer, dataBuffer);

            // Upgrade the old encoding of the PeptideData-objects.
            const upgradedMap = new ShareableMap<Peptide, PeptideData>(
                undefined,
                undefined,
                new PeptideDataSerializer()
            );
            for (const [peptide, data] of map.entries()) {
                const oldResponse = data.toPeptideDataResponse();
                oldResponse.lineage.splice(27, 1);
                upgradedMap.set(peptide, PeptideData.createFromPeptideDataResponse(data.toPeptideDataResponse()));
            }

            // Write the buffers to disk
            const [upgradedIndexBuffer, upgradedDataBuffer] = upgradedMap.getBuffers();
            const indexNodeBuffer = BufferUtils.arrayBufferToBuffer(upgradedIndexBuffer);
            const dataNodeBuffer = BufferUtils.arrayBufferToBuffer(upgradedDataBuffer);

            await this.writeToDisk(assayId, indexNodeBuffer, dataNodeBuffer);

            // Update the data hash in the database
            const dataHash = crypto.createHash("sha256");
            dataHash.update(dataNodeBuffer);

            const indexHash = crypto.createHash("sha256");
            indexHash.update(indexNodeBuffer);

            const fullHash = dataHash.digest("hex") + indexHash.digest("hex");

            database.prepare(`
                UPDATE storage_metadata
                SET
                    data_hash = ?
                WHERE
                    assay_id = ?
            `).run(fullHash, assayId);
        }
    }

    private async readFromDisk(assayId: string): Promise<[SharedArrayBuffer, SharedArrayBuffer]> {
        const bufferPath: string = path.join(this.projectLocation, ".buffers");
        const dataBufferPath = path.join(bufferPath, assayId + ".data");
        const indexBufferPath = path.join(bufferPath, assayId + ".index");

        const indexBuffer = await fs.readFile(indexBufferPath);
        const dataBuffer = await fs.readFile(dataBufferPath);
        return [BufferUtils.bufferToSharedArrayBuffer(indexBuffer), BufferUtils.bufferToSharedArrayBuffer(dataBuffer)];
    }

    private async writeToDisk(assayId: string, indexBuffer: Buffer, dataBuffer: Buffer): Promise<void> {
        const bufferPath: string = path.join(this.projectLocation, ".buffers");
        const dataBufferPath = path.join(bufferPath, assayId + ".data");
        const indexBufferPath = path.join(bufferPath, assayId + ".index");

        await fs.writeFile(indexBufferPath, indexBuffer);
        await fs.writeFile(dataBufferPath, dataBuffer);
    }
}

/**
 * Previous version of the PeptideData encoding, as was used to encode objects in the database up until (and including)
 * version 3 of the database.
 */
class PeptideDataV0 {
    // Offsets and lengths of the data fields in bytes.
    public static readonly LCA_OFFSET: number = 0;
    public static readonly LCA_SIZE: number = 4;

    // At what position in the array does the lineage array start.
    public static readonly LINEAGE_OFFSET: number = PeptideDataV0.LCA_OFFSET + PeptideDataV0.LCA_SIZE;
    public static readonly RANK_COUNT: number = 28;
    // 28 NCBI ranks at this moment (TODO should not be hardcoded)
    public static readonly LINEAGE_SIZE: number = 4 * PeptideDataV0.RANK_COUNT;

    // How many bytes are reserved for the counts of each functional annotation type?
    public static readonly FA_COUNT_SIZE = 4;

    // At what offset in the array do the functional annotation counts start?
    public static readonly FA_ALL_COUNT_OFFSET = PeptideDataV0.LINEAGE_OFFSET + PeptideDataV0.LINEAGE_SIZE;
    public static readonly FA_EC_COUNT_OFFSET = PeptideDataV0.FA_ALL_COUNT_OFFSET + PeptideDataV0.FA_COUNT_SIZE;
    public static readonly FA_GO_COUNT_OFFSET = PeptideDataV0.FA_EC_COUNT_OFFSET + PeptideDataV0.FA_COUNT_SIZE;
    public static readonly FA_IPR_COUNT_OFFSET = PeptideDataV0.FA_GO_COUNT_OFFSET + PeptideDataV0.FA_COUNT_SIZE;

    // How many bytes are reserved for a pointer to the different start positions in the data portion of the array?
    public static readonly FA_POINTER_SIZE = 4;

    // Where does the data portion start in the array?
    public static readonly FA_EC_INDEX_OFFSET = PeptideDataV0.FA_IPR_COUNT_OFFSET + PeptideDataV0.FA_COUNT_SIZE;
    public static readonly FA_GO_INDEX_OFFSET = PeptideDataV0.FA_EC_INDEX_OFFSET + PeptideDataV0.FA_POINTER_SIZE;
    public static readonly FA_IPR_INDEX_OFFSET = PeptideDataV0.FA_GO_INDEX_OFFSET + PeptideDataV0.FA_POINTER_SIZE;
    public static readonly FA_DATA_START = PeptideDataV0.FA_IPR_INDEX_OFFSET + PeptideDataV0.FA_POINTER_SIZE;

    private readonly dataView: DataView;

    constructor(
        public readonly buffer: ArrayBuffer
    ) {
        this.dataView = new DataView(buffer);
    }

    public static createFromPeptideDataResponse(response: PeptideDataResponse): PeptideDataV0 {
        const gos = response.fa.data ? Object.keys(response.fa.data).filter(
            code => code.startsWith("GO:")
        ) : [];
        const iprs = response.fa.data ? Object.keys(response.fa.data).filter(
            code => code.startsWith("IPR:")
        ) : [];
        const ecs = response.fa.data ? Object.keys(response.fa.data).filter(
            code => code.startsWith("EC:")
        ) : [];

        // We need 12 bytes to record the length of each of the functional annotation arrays.
        // GO is stored as an integer (4 bytes) and it's count (4 bytes for count)
        // IPR is stored as an integer (4 bytes) and it's count (4 bytes)
        // EC is stored as 4 integers (4 bytes) and it's count (4 bytes)
        const faDataLength = 12 + gos.length * 8 + iprs.length * 8 + ecs.length * 20;
        const bufferLength = PeptideDataV0.FA_DATA_START + faDataLength;

        const dataBuffer = new ArrayBuffer(bufferLength);

        // Now convert all the data into a binary format
        const dataView = new DataView(dataBuffer);
        dataView.setUint32(this.LCA_OFFSET, response.lca);

        // Copy the lineage array
        for (let i = 0; i < response.lineage.length; i++) {
            dataView.setInt32(this.LINEAGE_OFFSET + i * 4, response.lineage[i]);
        }

        dataView.setUint32(this.FA_ALL_COUNT_OFFSET, response.fa.counts.all);
        dataView.setUint32(this.FA_GO_COUNT_OFFSET, response.fa.counts.GO);
        dataView.setUint32(this.FA_IPR_COUNT_OFFSET, response.fa.counts.IPR);
        dataView.setUint32(this.FA_EC_COUNT_OFFSET, response.fa.counts.EC);

        // First convert EC-numbers to binary format
        // Keep track of where the EC-numbers encoding starts.
        dataView.setUint32(this.FA_EC_INDEX_OFFSET, this.FA_DATA_START);
        let currentPos = this.FA_DATA_START;
        // Keep track of how many EC-numbers are encoded.
        dataView.setUint32(currentPos, ecs.length);
        currentPos += 4;
        for (const ec of ecs) {
            const parts = ec.replace("EC:", "").split(".");
            // Encode null-values as -1
            dataView.setInt32(currentPos, parts[0] !== "-" ? parseInt(parts[0]) : -1);
            dataView.setInt32(currentPos + 4, parts[1] !== "-" ? parseInt(parts[1]) : -1);
            dataView.setInt32(currentPos + 8, parts[2] !== "-" ? parseInt(parts[2]) : -1);
            dataView.setInt32(currentPos + 12, parts[3] !== "-" ? parseInt(parts[3]) : -1);
            dataView.setUint32(currentPos + 16, response.fa.data[ec]);
            currentPos += 20;
        }

        // Now convert GO-terms to binary format
        // Keep track of where the GO-terms encoding starts.
        dataView.setUint32(this.FA_GO_INDEX_OFFSET, currentPos);
        // Keep track of how many GO-terms are encoded.
        dataView.setUint32(currentPos, gos.length);
        currentPos += 4;
        for (const go of gos) {
            dataView.setUint32(currentPos, parseInt(go.replace("GO:", "")));
            dataView.setUint32(currentPos + 4, response.fa.data[go]);
            currentPos += 8;
        }

        // Now convert IPR-terms to binary format
        // Keep track of where the IPR-terms encoding starts.
        dataView.setUint32(this.FA_IPR_INDEX_OFFSET, currentPos);
        // Keep track of how many IPR-terms are encoded.
        dataView.setUint32(currentPos, iprs.length);
        currentPos += 4;
        for (const ipr of iprs) {
            dataView.setUint32(currentPos, parseInt(ipr.replace("IPR:IPR", "")));
            dataView.setUint32(currentPos + 4, response.fa.data[ipr]);
            currentPos += 8;
        }

        return new PeptideDataV0(dataBuffer);
    }

    public get faCounts(): { all: number, ec: number, go: number, ipr: number } {
        return {
            all: this.dataView.getUint32(PeptideDataV0.FA_ALL_COUNT_OFFSET),
            ec: this.dataView.getUint32(PeptideDataV0.FA_EC_COUNT_OFFSET),
            go: this.dataView.getUint32(PeptideDataV0.FA_GO_COUNT_OFFSET),
            ipr: this.dataView.getUint32(PeptideDataV0.FA_IPR_COUNT_OFFSET)
        }
    }

    public get lca(): number {
        return this.dataView.getUint32(PeptideDataV0.LCA_OFFSET);
    }

    public get lineage(): number[] {
        const lin: number[] = [];
        for (let i = 0; i < PeptideDataV0.RANK_COUNT; i++) {
            const val = this.dataView.getInt32(PeptideDataV0.LINEAGE_OFFSET + i * 4);
            lin.push(
                val === 0 ? null : val
            );
        }
        return lin;
    }

    public get ec(): any {
        const output = {};

        let ecStart = this.dataView.getUint32(PeptideDataV0.FA_EC_INDEX_OFFSET);
        const ecLength = this.dataView.getUint32(ecStart);

        ecStart += 4;

        // Decode each of the EC numbers
        for (let i = 0; i < ecLength; i++) {
            const part1 = this.encodedNullOrNumberToString(this.dataView.getInt32(ecStart));
            const part2 = this.encodedNullOrNumberToString(this.dataView.getInt32(ecStart + 4));
            const part3 = this.encodedNullOrNumberToString(this.dataView.getInt32(ecStart + 8));
            const part4 = this.encodedNullOrNumberToString(this.dataView.getInt32(ecStart + 12));

            // @ts-ignore
            output[`EC:${part1}.${part2}.${part3}.${part4}`] = this.dataView.getUint32(ecStart + 16);

            ecStart += 20;
        }

        return output;
    }

    private encodedNullOrNumberToString(value: number): string {
        if (value === -1) {
            return "-";
        } else {
            return value.toString();
        }
    }

    public get go(): any {
        const output = {};

        let goStart = this.dataView.getUint32(PeptideDataV0.FA_GO_INDEX_OFFSET);
        const goLength = this.dataView.getUint32(goStart);

        goStart += 4;

        // Decode each of the GO terms
        for (let i = 0; i < goLength; i++) {
            const term = this.dataView.getUint32(goStart);

            // @ts-ignore
            output[
                "GO:" + StringUtils.leftPad(term.toString(), "0", 7)
            ] = this.dataView.getUint32(goStart + 4);

            goStart += 8;
        }

        return output;
    }

    public get ipr(): any {
        const output = {};

        let iprStart = this.dataView.getUint32(PeptideDataV0.FA_IPR_INDEX_OFFSET);
        const iprLength = this.dataView.getUint32(iprStart);

        iprStart += 4;

        // Decode each of the GO terms
        for (let i = 0; i < iprLength; i++) {
            const term = this.dataView.getUint32(iprStart);

            // @ts-ignore
            output[
                "IPR:IPR" + StringUtils.leftPad(term.toString(), "0", 6)
            ] = this.dataView.getUint32(iprStart + 4);

            iprStart += 8;
        }

        return output;
    }


    public toPeptideDataResponse(): PeptideDataResponse {
        const faCounts = this.faCounts;

        const dataObject = {};
        Object.assign(dataObject, this.go);
        Object.assign(dataObject, this.ec);
        Object.assign(dataObject, this.ipr);

        return {
            lca: this.lca,
            lineage: this.lineage,
            fa: {
                counts: {
                    all: faCounts.all,
                    EC: faCounts.ec,
                    GO: faCounts.go,
                    IPR: faCounts.ipr
                },
                data: dataObject
            }
        }
    }
}

/**
 * Serializer that accompanies the old PeptideData encoding which can be used by the ShareableMap.
 */
class PeptideDataV0Serializer {
    public decode(buffer: ArrayBuffer): PeptideDataV0 {
        return new PeptideDataV0(buffer);
    }

    public encode(object: PeptideDataV0): ArrayBuffer {
        return object.buffer;
    }
}

