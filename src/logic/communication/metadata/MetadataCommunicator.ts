import { NetworkConfiguration, NetworkUtils } from "unipept-web-components";

export default class MetadataCommunicator {
    private static METADATA_ENDPOINT: string = "/private_api/metadata";

    public static async getRemoteUniprotVersion(): Promise<string>  {
        try {
            const result = await NetworkUtils.getJSON(
                NetworkConfiguration.BASE_URL + MetadataCommunicator.METADATA_ENDPOINT
            );
            return "UniProt " + result["db_version"];
        } catch (err) {
            return "N/A";
        }
    }
}
