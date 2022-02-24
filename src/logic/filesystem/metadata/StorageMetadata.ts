import { SearchConfiguration } from "unipept-web-components";

export default class StorageMetadata {
    constructor(
        public readonly assayId: string,
        public readonly searchConfiguration: SearchConfiguration,
        public readonly endpoint: string,
        public readonly fingerprint: string,
        public readonly dataHash: string,
        public readonly analysisDate: Date
    ) {}
}
