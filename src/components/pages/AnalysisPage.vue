<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <single-dataset-visualizations-card
                    :peptide-count-table="activeAssay ? $store.getters.getProject.getProcessingResults(activeAssay).countTable : undefined"
                    :search-configuration="activeAssay ? activeAssay.getSearchConfiguration() : undefined"
                    :analysisInProgress="$store.getters.getProject.getAllAssays.length > 0"
                    v-on:update-selected-term="onUpdateSelectedTerm"
                    v-on:update-selected-taxon-id="onUpdateSelectedTaxonId">
                </single-dataset-visualizations-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <functional-summary-card
                    :peptide-count-table="activeAssay ? $store.getters.getProject.getProcessingResults(activeAssay).countTable : undefined"
                    :search-configuration="activeAssay ? activeAssay.getSearchConfiguration() : undefined"
                    :analysisInProgress="$store.getters.getProject.getAllAssays.length > 0"
                    :selectedTaxonId="$store.getters.getSelectedTaxonId">
                </functional-summary-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import SingleDatasetVisualizationsCard
    from "unipept-web-components/src/components/visualizations/SingleDatasetVisualizationsCard.vue";
import FunctionalSummaryCard from "unipept-web-components/src/components/analysis/functional/FunctionalSummaryCard.vue";
import Assay from "unipept-web-components/dist/business/entities/assay/Assay";
import ProteomicsAssay from "unipept-web-components/dist/business/entities/assay/ProteomicsAssay";

@Component({
    components: {
        SingleDatasetVisualizationsCard,
        FunctionalSummaryCard
    },
    computed: {
        activeAssay: {
            get(): ProteomicsAssay {
                return this.$store.getters.getProject.activeAssay;
            }
        }
    }
})
export default class AnalysisPage extends Vue {
    private onUpdateSelectedTaxonId(id: number) {
        this.$store.dispatch("setSelectedTaxonId", id);
    }

    private onUpdateSelectedTerm(term: string) {
        this.$store.dispatch("setSelectedTerm", term);
    }
}
</script>

<style>
    .container-after-titlebar .analysis-container .container {
        height: calc(100vh - 94px);
        min-height: calc(100vh - 94px) !important;
        overflow-y: auto;
    }
</style>
