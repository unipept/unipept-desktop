import { AnalysisSource, MetaDataCommunicator, Pept2DataCommunicator, ProteomicsAssay } from "unipept-web-components";
import crypto from "crypto";
import ConfigureableCommunicationSource from "@/logic/communication/source/ConfigureableCommunicationSource";
import CachedPept2DataCommunicator from "@/logic/communication/peptides/CachedPept2DataCommunicator";
import CachedGoResponseCommunicator from "@/logic/communication/functional/CachedGoResponseCommunicator";
import CachedEcResponseCommunicator from "@/logic/communication/functional/CachedEcResponseCommunicator";
import CachedInterproResponseCommunicator from "@/logic/communication/functional/CachedInterproResponseCommunicator";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Store } from "vuex";

export default class CachedOnlineAnalysisSource implements AnalysisSource {
    constructor(
        public readonly endpoint: string,
        public readonly assay: ProteomicsAssay,
        public readonly dbManager: DatabaseManager,
        public readonly projectLocation: string,
        private readonly store: Store<any>
    ) {}

    public async computeFingerprint(): Promise<string> {
        const metadataCommunicator = new MetaDataCommunicator(this.endpoint);
        const dbVersion = await metadataCommunicator.getCurrentUniprotVersion();

        const hash = crypto.createHash("sha256");
        hash.update(this.endpoint + dbVersion + this.assay.getId());

        return hash.digest("base64");
    }

    public getCommunicationSource() {
        const pept2DataCommunicator = new CachedPept2DataCommunicator(
            this.assay,
            new Pept2DataCommunicator(this.endpoint),
            this.dbManager,
            this.projectLocation,
            this.store
        );

        return new ConfigureableCommunicationSource(
            pept2DataCommunicator,
            new CachedGoResponseCommunicator(),
            new CachedEcResponseCommunicator(),
            new CachedInterproResponseCommunicator(),
            new CachedNcbiResponseCommunicator()
        );
    }

    public async verifyEquality(hash: string): Promise<boolean> {
        const currentHash = await this.computeFingerprint();
        return currentHash === hash;
    }
}
