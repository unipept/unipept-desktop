<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <single-dataset-visualizations-card :sample="this.$store.getters.activeDataset ? this.$store.getters.activeDataset.getDataset() : null" :analysisInProgress="$store.getters.datasetsInProgress > 0">
                </single-dataset-visualizations-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <functional-summary-card :sample="this.$store.getters.activeDataset ? this.$store.getters.activeDataset.getDataset() : null" :analysisInProgress="$store.getters.datasetsInProgress > 0">
                </functional-summary-card>
            </v-col>
        </v-row>
    </v-container>
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

</style>
