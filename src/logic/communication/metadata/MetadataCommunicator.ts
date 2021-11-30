import { NetworkConfiguration, NetworkUtils } from "unipept-web-components";

export default class MetadataCommunicator {
    private static METADATA_ENDPOINT: string = "/private_api/metadata";

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
}
