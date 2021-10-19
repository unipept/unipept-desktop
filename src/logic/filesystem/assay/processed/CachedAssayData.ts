import { PeptideData, SearchConfiguration, PeptideTrust, Peptide } from "unipept-web-components";
import { ShareableMap } from "shared-memory-datastructures";

/**
 * The deserialized result of what belongs to an assay and was stored in the database for this particular assay.
 */
export default class CachedAssayData {
    constructor(
        public readonly pept2DataMap: ShareableMap<Peptide, PeptideData>,
        public readonly peptideTrust: PeptideTrust
    ) {}
}
