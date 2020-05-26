import { ShareableMap } from "shared-memory-datastructures";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { expose } from "threads";
import NcbiTaxon from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { Ontology } from "unipept-web-components/src/business/ontology/Ontology";
import NcbiOntologyProcessor from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiOntologyProcessor";
import { DataOptions } from "vuetify";

let pept2DataMap: ShareableMap<Peptide, string>;
let peptideCountTable: Map<Peptide, number>;
let peptides: Peptide[];
let lcaIds: number[];
let lcaOntology: Ontology<number, NcbiTaxon>;

expose({ setPept2DataMap, setPeptideCountTable, setLcaOntology, getLcaIds, getItems });

function getLcaIds(): number[] {
    return lcaIds;
}

function setPept2DataMap(indexBuffer, dataBuffer) {
    pept2DataMap = new ShareableMap<Peptide, string>(0, 0);
    pept2DataMap.setBuffers(indexBuffer, dataBuffer);
}

function setPeptideCountTable(countTable: Map<Peptide, number>) {
    peptideCountTable = countTable;
    lcaIds = [];

    peptides = [];
    for (const peptide of peptideCountTable.keys()) {
        peptides.push(peptide);
        const response = pept2DataMap.get(peptide);
        if (response) {
            lcaIds.push(JSON.parse(response).lca);
        }
    }
}

function setLcaOntology(ontology: Ontology<number, NcbiTaxon>) {
    lcaOntology = ontology;
}

function getItems(options: DataOptions): {
    peptide: string,
    count: number,
    lca: string,
    matched: boolean
}[] {
    try {
        let output = [];
        const start = options.itemsPerPage * (options.page - 1);
        let end = options.itemsPerPage * options.page;

        if (end > peptides.length) {
            end = peptides.length;
        }

        // peptides.sort((a: Peptide, b: Peptide) => {
        //     const sortItem = options.sortBy[0];
        // });

        for (let i = start; i < end; i++) {
            const peptide = peptides[i];
            const response = pept2DataMap.get(peptide);
            let lcaName: string = "N/A";
            let matched: boolean = false;

            if (response) {
                matched = true;
                // @ts-ignore
                const lcaDefinition = lcaOntology.definitions.get(JSON.parse(response).lca);
                lcaName = lcaDefinition ? lcaDefinition.name : lcaName;
            }

            output.push({
                peptide: peptide,
                count: peptideCountTable.get(peptide),
                lca: lcaName,
                matched: matched
            })
        }

        return output;
    } catch (err) {
        console.error(err);
    }
}
