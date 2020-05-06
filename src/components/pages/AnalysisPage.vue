<template>
    <v-container fluid v-if="!errorStatus">
        <v-row>
            <v-col>
                <analysis-summary
                    :assay="activeAssay"
                    :peptide-count-table="activeCountTable"
                    :project="$store.getters.getProject">
                </analysis-summary>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <single-dataset-visualizations-card
                    :peptide-count-table="activeCountTable"
                    :search-configuration="activeAssay ? activeAssay.getSearchConfiguration() : undefined"
                    :analysisInProgress="$store.getters.getProject.getAllAssays().length > 0"
                    v-on:update-selected-term="onUpdateSelectedTerm"
                    v-on:update-selected-taxon-id="onUpdateSelectedTaxonId">
                </single-dataset-visualizations-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <functional-summary-card
                    :peptide-count-table="activeCountTable"
                    :search-configuration="activeAssay ? activeAssay.getSearchConfiguration() : undefined"
                    :analysisInProgress="$store.getters.getProject.getAllAssays().length > 0"
                    :selectedTaxonId="$store.getters.getSelectedTaxonId">
                </functional-summary-card>
            </v-col>
        </v-row>
    </v-container>
    <v-container fluid v-else class="error-container">
        <div class="network-error">
            <v-icon x-large>
                mdi-wifi-strength-4-alert
            </v-icon>
            <p>
                A network communication error occurred while processing this assay. Please check that you
                are connected to the internet, or that your Unipept API-endpoint is correctly set and
                <a @click="reanalyse()">try again.</a>
            </p>
        </div>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import SingleDatasetVisualizationsCard
    from "unipept-web-components/src/components/visualizations/SingleDatasetVisualizationsCard.vue";
import FunctionalSummaryCard from "unipept-web-components/src/components/analysis/functional/FunctionalSummaryCard.vue";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import AnalysisSummary from "@/components/analysis/AnalysisSummary.vue";

@Component({
    components: {
        AnalysisSummary,
        SingleDatasetVisualizationsCard,
        FunctionalSummaryCard
    },
    computed: {
        activeAssay: {
            get(): ProteomicsAssay {
                return this.$store.getters.getProject.activeAssay;
            }
        },
        activeCountTable: {
            get(): CountTable<Peptide> {
                if (this.activeAssay) {
                    return this.$store.getters.getProject.getProcessingResults(this.activeAssay).countTable;
                } else {
                    return undefined;
                }
            }
        },
        errorStatus: {
            get(): boolean {
                if (!this.activeAssay) {
                    return false;
                }

                return this.$store.getters.getProject.getProcessingResults(this.activeAssay).errorStatus !== undefined;
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

    private reanalyse() {
        const activeAssay = this.$store.getters.getProject.activeAssay;
        if (activeAssay) {
            this.$store.getters.getProject.processAssay(activeAssay);
        }
    }
}
</script>

<style>
    .container-after-titlebar .analysis-container .container {
        height: calc(100vh - 94px);
        min-height: calc(100vh - 94px) !important;
        overflow-y: auto;
    }

    .network-error {
        max-width: 600px;
        display: flex;
        justify-content: center;
        flex-direction: column;
        text-align: center;
    }

    .error-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
