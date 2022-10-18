import Proteome from "@/logic/communication/proteomes/Proteome";
import { NetworkUtils } from "unipept-web-components";

export default class ProteomeCommunicator {
    public static async listReferenceProteomes(): Promise<Proteome[]> {
        return null;
        //
        // const result = await NetworkUtils.getJSON(
        //     "https://rest.uniprot.org/proteomes/stream?fields=upid%2Corganism%2Corganism_id%2Cprotein_count%2Cbusco%2Ccpd&format=tsv&query=%28%2A%29"
        // );
        //
        // console.log(result);
        // return null;
    }

    public static async getProteomeById(id: string): Promise<Proteome> {
        id = id.toUpperCase();
        const result = await NetworkUtils.get(
            `https://rest.uniprot.org/proteomes/stream?compressed=false&fields=upid,organism,organism_id,protein_count&format=tsv&query=(${id})`
        );

        const resultLines = result.trimEnd().split("\n");

        if (resultLines.length < 2) {
            // Only the header is present, we didn't find the requested proteome and return null.
            return null;
        } else if (resultLines.length === 2) {
            // We found the requested proteome, but we are first going to check if it's redundant or not.
            const validProteomes = await NetworkUtils.get(
                `https://rest.uniprot.org/proteomes/stream?compressed=false&fields=upid,organism,organism_id,protein_count&format=tsv&query=(${id}) AND ((proteome_type=1) OR (proteome_type=2))`
            );

            // Input data is TSV, so we split the fields by a tab-character.
            const data = resultLines[1].split("\t");
            // First field is ID, second is organism name, third is organism ID, fourth is protein count
            return new Proteome(data[0], data[1], parseInt(data[2]), parseInt(data[3]), !validProteomes.includes(id));
        } else {
            // Multiple reference proteomes with this ID were found and an error will be thrown in this case.
            throw new Error(`Invalid reference proteome ID ${id} was provided.`);
        }
    }
}
