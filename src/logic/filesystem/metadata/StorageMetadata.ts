import { AnalysisSource, SearchConfiguration } from "unipept-web-components";

export default class StorageMetadata {
    constructor(
        public readonly assayId: string,
        public readonly searchConfiguration: SearchConfiguration,
        public readonly analysisSource: AnalysisSource,
        public readonly dataHash: string,
        public readonly analysisDate: Date
    ) {}
}
