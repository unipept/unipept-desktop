import { PeptideData, SearchConfiguration, PeptideTrust } from "unipept-web-components";
import { ShareableMap } from "shared-memory-datastructures";

/**
 * The deserialized result of what belongs to an assay and was stored in the database for this particular assay.
 */
export default class ProcessedAssayResult {
    constructor(
        public readonly endpoint: string,
        public readonly databaseVersion: string,
        public readonly searchConfiguration: SearchConfiguration,
        public readonly pept2DataMap: ShareableMap<string, PeptideData>,
        public readonly peptideTrust: PeptideTrust
    ) {}
}
