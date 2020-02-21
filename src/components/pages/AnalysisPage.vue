<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <single-dataset-visualizations-card 
                    :dataRepository="dataRepository"
                    :analysisInProgress="$store.getters.getProject.getAllAssays.length > 0"
                    v-on:update-selected-term="onUpdateSelectedTerm"
                    v-on:update-selected-taxon-id="onUpdateSelectedTaxonId">
                </single-dataset-visualizations-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <functional-summary-card 
                    :dataRepository="dataRepository"
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
import SingleDatasetVisualizationsCard from "unipept-web-components/src/components/visualizations/SingleDatasetVisualizationsCard.vue";
import FunctionalSummaryCard from "unipept-web-components/src/components/analysis/functional/FunctionalSummaryCard.vue";
import DataRepository from "unipept-web-components/src/logic/data-source/DataRepository";

@Component({
    components: {
        SingleDatasetVisualizationsCard,
        FunctionalSummaryCard
    },
    computed: {
        dataRepository: {
            get(): DataRepository {
                if (this.$store.getters.getProject.activeAssay) {
                    return this.$store.getters.getProject.activeAssay.dataRepository;
                }
                return null;
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
