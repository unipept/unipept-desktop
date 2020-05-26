import { ShareableMap } from "shared-memory-datastructures";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { expose } from "threads";
import NcbiTaxon from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { Ontology } from "unipept-web-components/src/business/ontology/Ontology";
import NcbiOntologyProcessor from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiOntologyProcessor";
import { DataOptions } from "vuetify";

type ItemType = {
    peptide: string,
    count: number,
    lca: string,
    matched: boolean
};

let pept2DataMap: ShareableMap<Peptide, string>;
let peptideCountTable: Map<Peptide, number>;
let peptides: Peptide[];
let lcaIds: number[];
let lcaOntology: Ontology<number, NcbiTaxon>;
let items: ItemType[];

expose({ setPept2DataMap, setPeptideCountTable, setLcaOntology, getLcaIds, getItems, computeItems });

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

function computeItems() {
    const output = [];

    for (const peptide of peptides) {
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

    items = output;
}

function getItems(options: DataOptions): ItemType[] {
    if (!items) {
        return [];
    }

    const start = options.itemsPerPage * (options.page - 1);
    let end = options.itemsPerPage * options.page;

    if (end > peptides.length) {
        end = peptides.length;
    }

    let sortKey = "peptide";

    if (options.sortBy.length > 0) {
        sortKey = options.sortBy[0];
    }

    items.sort((a: ItemType, b: ItemType) => {
        let value: number = a[sortKey] > b[sortKey] ? 1 : -1;
        if (options.sortDesc.length > 0 && options.sortDesc[0]) {
            value *= -1;
        }
        return value;
    })

    return items.slice(start, end);
}
