import { expose } from "threads/worker";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";

expose(readAssay)

async function readAssay(peptidesString: string): Promise<Peptide[]> {
    const output = [];
    let terminatorPos = peptidesString.indexOf("\n");
    let previousTerminatorPos = 0;
    while (terminatorPos !== -1) {
        output.push(peptidesString.substring(previousTerminatorPos, terminatorPos).trimEnd());
        previousTerminatorPos = terminatorPos + 1;
        terminatorPos = peptidesString.indexOf("\n", previousTerminatorPos);
    }
    return output;
}
