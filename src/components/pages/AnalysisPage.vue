<template>
    <div class="analysis-container">
        <v-container fluid>
            <v-row>
                <v-col>
                    <!-- TODO fix analysis in progress! -->
                    <single-dataset-visualizations-card :dataRepository="this.$store.getters.activeDataset ? this.$store.getters.activeDataset.dataRepository : null" :analysisInProgress="$store.getters.datasetsInProgress > 0">
                    </single-dataset-visualizations-card>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <!-- TODO fix analysis in progress! -->
                    <functional-summary-card :dataRepository="this.$store.getters.activeDataset ? this.$store.getters.activeDataset.dataRepository : null" :analysisInProgress="$store.getters.datasetsInProgress > 0">
                    </functional-summary-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {Prop, Watch} from 'vue-property-decorator';
import Component from 'vue-class-component';
import PeptideContainer from 'unipept-web-components/src/logic/data-management/PeptideContainer';
import SingleDatasetVisualizationsCard from 'unipept-web-components/src/components/visualizations/SingleDatasetVisualizationsCard.vue';
import FunctionalSummaryCard from 'unipept-web-components/src/components/analysis/functional/FunctionalSummaryCard.vue';

@Component({
    components: {
        SingleDatasetVisualizationsCard,
        FunctionalSummaryCard
    }
})
export default class AnalysisPage extends Vue {
}
</script>

<style>
    .container-after-titlebar .analysis-container .container {
        height: calc(100vh - 94px);
        min-height: calc(100vh - 94px) !important;
        overflow-y: auto;
    }
</style>
