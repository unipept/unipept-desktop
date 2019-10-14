<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <!-- TODO fix analysis in progress! -->
                <single-dataset-visualizations-card :sample="this.$store.getters.activeDataset ? this.$store.getters.activeDataset.getDataset() : null" :analysisInProgress="false">
                </single-dataset-visualizations-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <!-- TODO fix analysis in progress! -->
                <functional-summary-card :sample="this.$store.getters.activeDataset ? this.$store.getters.activeDataset.getDataset() : null" :analysisInProgress="false">
                </functional-summary-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import {Prop, Watch} from 'vue-property-decorator';
import Component from 'vue-class-component';
import AnalysisComponent from 'unipept-web-components/src/components/analysis/AnalysisComponent.vue';
import PeptideContainer from 'unipept-web-components/src/logic/data-management/PeptideContainer';
import SingleDatasetVisualizationsCard from 'unipept-web-components/src/components/visualizations/SingleDatasetVisualizationsCard.vue';
import FunctionalSummaryCard from 'unipept-web-components/src/components/analysis/functional/FunctionalSummaryCard.vue';

@Component({
    components: {
        AnalysisComponent,
        SingleDatasetVisualizationsCard,
        FunctionalSummaryCard
    }
})
export default class AnalysisPage extends Vue {
    private onSelectDataset(dataset: PeptideContainer): void {
        this.$store.dispatch('selectDataset', dataset);
    }
}
</script>

<style>

</style>
