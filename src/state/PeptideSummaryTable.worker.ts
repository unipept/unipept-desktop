import { ShareableMap } from "shared-memory-datastructures";
import { expose } from "threads";
import NcbiTaxon from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { Ontology } from "unipept-web-components/src/business/ontology/Ontology";
import PeptideData from "unipept-web-components/src/business/communication/peptides/PeptideData";
import PeptideDataSerializer from "unipept-web-components/src/business/communication/peptides/PeptideDataSerializer";
import { DataOptions } from "vuetify";
import { Observable } from "observable-fns";

export type ItemType = {
    peptide: string,
    count: number,
    lca: string,
    rank: string
};

// Maps an assay's id onto a list of all peptide summary items for this assay.
const itemsPerAssay: Map<string, ItemType[]> = new Map();

expose({ getItems, computeItems });

function computeItems(
    assayId: string,
    indexBuffer: SharedArrayBuffer,
    dataBuffer: SharedArrayBuffer,
    countTable: Map<Peptide, number>,
    lcaOntology: Ontology<number, NcbiTaxon>
): Observable<number> {
    return new Observable((obs) => {
        const output = [];

        obs.next(0);

        const pept2DataMap: ShareableMap<Peptide, PeptideData> = new ShareableMap(
            0,
            0,
            new PeptideDataSerializer()
        );
        pept2DataMap.setBuffers(indexBuffer, dataBuffer);

        const totalPeptides: number = countTable.size;
        let processedPeptides: number = 0;

        const start = new Date().getTime();

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

            processedPeptides++;

            if (processedPeptides % 5000 === 0) {
                obs.next(processedPeptides / totalPeptides);
            }
        }

        const end = new Date().getTime();
        console.log("Peptide summary took: " + (end - start) / 1000 + "s for --> " + assayId);

        itemsPerAssay.set(assayId, output);
        obs.next(1);
        obs.complete();
    });
}

function getItems(assayId: string, options: DataOptions): ItemType[] {
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
