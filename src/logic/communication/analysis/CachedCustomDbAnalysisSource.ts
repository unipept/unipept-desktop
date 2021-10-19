import { AnalysisSource, ProteomicsAssay } from "unipept-web-components";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import LocalPept2DataCommunicator from "@/logic/communication/peptides/LocalPept2DataCommunicator";
import ConfigureableCommunicationSource from "@/logic/communication/source/ConfigureableCommunicationSource";
import CachedGoResponseCommunicator from "@/logic/communication/functional/CachedGoResponseCommunicator";
import CachedEcResponseCommunicator from "@/logic/communication/functional/CachedEcResponseCommunicator";
import CachedInterproResponseCommunicator from "@/logic/communication/functional/CachedInterproResponseCommunicator";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import CachedPept2DataCommunicator from "@/logic/communication/peptides/CachedPept2DataCommunicator";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

export default class CachedCustomDbAnalysisSource implements AnalysisSource {
    constructor(
        public readonly assay: ProteomicsAssay,
        public readonly databaseMng: DatabaseManager,
        public readonly customDatabase: CustomDatabase,
        public readonly customDatabaseStorageLocation: string,
        public readonly projectLocation: string
    ) {}

    public getCommunicationSource() {
        const pept2DataCommunicator = new LocalPept2DataCommunicator(
            this.customDatabase,
            this.customDatabaseStorageLocation
        );

        return new ConfigureableCommunicationSource(
            new CachedPept2DataCommunicator(this.assay, pept2DataCommunicator, this.databaseMng, this.projectLocation),
            new CachedGoResponseCommunicator(),
            new CachedEcResponseCommunicator(),
            new CachedInterproResponseCommunicator(),
            new CachedNcbiResponseCommunicator()
        );
    }

    public async computeFingerprint(): Promise<string> {
        return this.customDatabase.getDatabaseHash();
    }

    public async verifyEquality(hash: string): Promise<boolean> {
        const currentHash = await this.computeFingerprint();
        return currentHash === hash;
    }
}
