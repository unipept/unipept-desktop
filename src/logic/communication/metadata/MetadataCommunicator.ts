import { NcbiId, NetworkConfiguration, NetworkUtils } from "unipept-web-components";

export default class MetadataCommunicator {
    private static METADATA_ENDPOINT = "/private_api/metadata";
    private static UNIPROT_API_URL = "https://rest.uniprot.org/uniprotkb/search";

    /**
     * Looks up what the most recent UniProt-version is that is available at the endpoint for the given URL.
     *
     * @param baseUrl URL for the endpoint from which the UniProt-version should be retrieved.
     */
    public static async getRemoteUniprotVersion(baseUrl: string): Promise<string>  {
        try {
            const result = await NetworkUtils.getJSON(
                baseUrl + MetadataCommunicator.METADATA_ENDPOINT
            );
            return "UniProt " + result["db_version"];
        } catch (err) {
            return "N/A";
        }
    }

    /**
     * Connects to the UniProt API and requests how many UniProt-records are associated with the given list of NCBI
     * IDs.
     *
     * @param taxa
     * @param swissprotSelected
     * @param tremblSelected
     */
    public static async getUniProtRecordCount(
        taxa: NcbiId[],
        swissprotSelected: boolean,
        tremblSelected: boolean
    ): Promise<number> {
        let idQuery: string;
        if (taxa.length === 0) {
            idQuery = "*";
        } else {
            idQuery = taxa.map(taxon => `taxonomy_id:${taxon}`).join("+OR+");
        }

        const result = await NetworkUtils.getJSON(
            `${MetadataCommunicator.UNIPROT_API_URL}?facets=reviewed&query=${idQuery}&size=0`
        );

        let totalCount = 0;

        if (swissprotSelected) {
            totalCount += result["facets"][0]["values"]
                .find((item: any) => item["label"] === "Reviewed (Swiss-Prot)")["count"];
        }

        if (tremblSelected) {
            totalCount += result["facets"][0]["values"]
                .find((item: any) => item["label"] === "Unreviewed (TrEMBL)")["count"];
        }

        return totalCount;
    }
}
