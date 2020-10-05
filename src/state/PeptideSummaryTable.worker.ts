import { ShareableMap } from "shared-memory-datastructures";
import NcbiTaxon from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { Ontology } from "unipept-web-components/src/business/ontology/Ontology";
import PeptideData from "unipept-web-components/src/business/communication/peptides/PeptideData";
import PeptideDataSerializer from "unipept-web-components/src/business/communication/peptides/PeptideDataSerializer";
import { DataOptions } from "vuetify";

export type ItemType = {
    peptide: string,
    count: number,
    lca: string,
    rank: string
};

const ctx: Worker = self as any;

ctx.addEventListener("message", (message: MessageEvent) => {
    if (message.data.type === "computeItems") {
        computeItems(message.data.args);
        ctx.postMessage({
            type: "result"
        });
    } else if (message.data.type === "getItems") {
        ctx.postMessage({
            type: "result",
            result: getItems(message.data.args)
        });
    }
});

// Maps an assay's id onto a list of all peptide summary items for this assay.
const itemsPerAssay: Map<string, ItemType[]> = new Map();

function computeItems(
    [
        assayId,
        indexBuffer,
        dataBuffer,
        countTable,
        lcaOntology
    ]: [string, ArrayBuffer, ArrayBuffer, Map<Peptide, number>, Ontology<number, NcbiTaxon>]
): void {
    const output = [];

    const pept2DataMap: ShareableMap<Peptide, PeptideData> = new ShareableMap(
        0,
        0,
        new PeptideDataSerializer()
    );
    pept2DataMap.setBuffers(indexBuffer, dataBuffer);

    for (const peptide of countTable.keys()) {
        const response: PeptideData = pept2DataMap.get(peptide);
        let lcaName: string = "N/A";
        let rank: string = "N/A";

        if (response) {
            // @ts-ignore
            const lcaDefinition = lcaOntology.definitions.get(response.lca);
            lcaName = lcaDefinition ? lcaDefinition.name : lcaName;
            rank = lcaDefinition ? lcaDefinition.rank : rank;
        }

        output.push({
            peptide: peptide,
            count: countTable.get(peptide),
            lca: lcaName,
            rank: rank
        });
    }


    itemsPerAssay.set(assayId, output);
}

function getItems([assayId, options]: [string, DataOptions]): ItemType[] {
    const itemsForAssay = itemsPerAssay.get(assayId);

    if (!itemsForAssay) {
        return [];
    }

    const start = options.itemsPerPage * (options.page - 1);
    let end = options.itemsPerPage * options.page;

    if (end > itemsForAssay.length) {
        end = itemsForAssay.length;
    }

    let sortKey = "peptide";

    if (options.sortBy.length > 0) {
        sortKey = options.sortBy[0];
    }

    itemsForAssay.sort((a: ItemType, b: ItemType) => {
        // @ts-ignore
        let value: number = a[sortKey] > b[sortKey] ? 1 : -1;
        if (options.sortDesc.length > 0 && options.sortDesc[0]) {
            value *= -1;
        }
        return value;
    })

    return itemsForAssay.slice(start, end);
}
