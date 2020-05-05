<template>
    <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page="5">
        <template v-slot:item.matched="{ item }">
            <div>
                <v-checkbox hide-details v-model="item.matched" readonly class="mt-0 pt-0 float-right"></v-checkbox>
            </div>
        </template>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import NcbiOntologyProcessor from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiOntologyProcessor";

@Component
export default class PeptideSummaryTable extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: true })
    private peptideCountTable: CountTable<Peptide>;

    private items = [];

    private headers = [
        {
            text: "Peptide",
            align: "start",
            value: "peptide",
            width: "30%"
        },
        {
            text: "Occurrence",
            align: "start",
            value: "count",
            width: "30%"
        }, {
            text: "Lowest common ancestor",
            align: "start",
            value: "lca",
            width: "30%"
        }, {
            text: "Matched?",
            align: "end",
            value: "matched",
            width: "10%"
        }
    ]

    private async mounted() {
        await this.computeItems();
    }

    @Watch("assay")
    private async computeItems() {
        if (this.peptideCountTable) {
            this.items.length = 0;

            await Pept2DataCommunicator.process(this.peptideCountTable, this.assay.getSearchConfiguration());
            const lcaIds = [];

            this.peptideCountTable.getOntologyIds().map((peptide) => {
                const response = Pept2DataCommunicator.getPeptideResponse(peptide, this.assay.getSearchConfiguration());
                if (response) {
                    lcaIds.push(response.lca);
                }
            });

            const lcaOntology = await (new NcbiOntologyProcessor()).getOntologyByIds(lcaIds);

            this.items.push(...this.peptideCountTable.getOntologyIds().map((peptide) => {
                const response = Pept2DataCommunicator.getPeptideResponse(peptide, this.assay.getSearchConfiguration());
                let lcaName: string = "N/A";
                let matched: boolean = false;

                if (response) {
                    matched = true;
                    const lcaDefinition = lcaOntology.getDefinition(response.lca);
                    lcaName = lcaDefinition ? lcaDefinition.name : lcaName;
                }

                return {
                    peptide: peptide,
                    count: this.peptideCountTable.getCounts(peptide),
                    lca: lcaName,
                    matched: matched
                }
            }));
        }
    }
}
</script>

<style scoped>

</style>
