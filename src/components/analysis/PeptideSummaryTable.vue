<template>
    <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page="5"
        :loading="loading || progress !== 1">
        <template v-slot:item.matched="{ item }">
            <v-tooltip v-if="item.matched" bottom>
                <template v-slot:activator="{ on }">
                    <v-icon v-on="on">mdi-check</v-icon>
                </template>
                <span>This peptide was matched with at least one protein.</span>
            </v-tooltip>
            <v-tooltip v-else bottom>
                <template v-slot:activator="{ on }">
                    <v-icon>mdi-close</v-icon>
                </template>
                <span>We were unable to match this peptide with a protein.</span>
            </v-tooltip>
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
import Project from "@/logic/filesystem/project/Project";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";

@Component({
    computed: {
        progress: {
            get(): number {
                if (this.project) {
                    return this.project.getProcessingResults(this.assay).progress;
                } else {
                    return 0;
                }
            }
        }
    }
})
export default class PeptideSummaryTable extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: true })
    private project: Project;
    @Prop({ required: true })
    private peptideCountTable: CountTable<Peptide>;
    @Prop({ required: true })
    private communicationSource: CommunicationSource;

    private items = [];

    private loading: boolean = false;

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
            align: "center",
            value: "matched",
            width: "10%"
        }
    ]

    private async mounted() {
        await this.computeItems();
    }

    @Watch("assay")
    @Watch("peptideCountTable")
    private async computeItems() {
        this.items.splice(0, this.items.length);

        if (this.peptideCountTable) {
            this.loading = true;
            const pept2DataCommunicator = this.communicationSource.getPept2DataCommunicator();
            await pept2DataCommunicator.process(this.peptideCountTable, this.assay.getSearchConfiguration());
            const lcaIds = [];

            this.peptideCountTable.getOntologyIds().map((peptide) => {
                const response = pept2DataCommunicator.getPeptideResponse(peptide, this.assay.getSearchConfiguration());
                if (response) {
                    lcaIds.push(response.lca);
                }
            });

            const lcaOntology = await (new NcbiOntologyProcessor(this.communicationSource)).getOntologyByIds(lcaIds);

            this.items.push(...this.peptideCountTable.getOntologyIds().map((peptide) => {
                const response = pept2DataCommunicator.getPeptideResponse(peptide, this.assay.getSearchConfiguration());
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
            this.loading = false;
        }
    }
}
</script>

<style scoped>

</style>
