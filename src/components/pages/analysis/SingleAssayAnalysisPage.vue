<template>
    <div>
        <v-row>
            <v-col>
                <analysis-summary :assay="activeAssay"></analysis-summary>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <single-dataset-visualizations-card
                    :assay="activeAssay"
                    :analysisInProgress="true"
                    v-on:update-selected-term="onUpdateSelectedTerm"
                    v-on:update-selected-taxon-id="onUpdateSelectedTaxonId">
                </single-dataset-visualizations-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <functional-summary-card
                    :assay="activeAssay"
                    :analysisInProgress="true">
                </functional-summary-card>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
    ProteomicsAssay,
    SingleDatasetVisualizationsCard,
    FunctionalSummaryCard
} from "unipept-web-components";
import AnalysisSummary from "@/components/analysis/AnalysisSummary.vue";

@Component({
    components: {
        SingleDatasetVisualizationsCard,
        FunctionalSummaryCard,
        AnalysisSummary
    }
})
export default class SingleAssayAnalysisPage extends Vue {
    get activeAssay(): ProteomicsAssay {
        return this.$store.getters.activeAssay;
    }

    private onUpdateSelectedTaxonId(id: number) {
        this.$store.dispatch("setSelectedTaxonId", id);
    }

    private onUpdateSelectedTerm(term: string) {
        this.$store.dispatch("setSelectedTerm", term);
    }
}
</script>

<style scoped>

</style>
