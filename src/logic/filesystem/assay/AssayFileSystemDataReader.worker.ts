import { expose } from "threads/worker";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";

expose(readAssay)

async function readAssay(peptidesString: string): Promise<Peptide[]> {
    return peptidesString.split(/\r?\n/);
}


