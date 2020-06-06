<template>
    <v-container fluid v-if="
        !errorStatus &&
        $store.getters.getProject.getAllAssays().length > 0 &&
        (maxProgress === 1 && activeProgress === 1)">
        <v-row>
            <v-col>
                <analysis-summary
                    :assay="activeAssay"
                    :peptide-count-table="activeCountTable"
                    :project="$store.getters.getProject"
                    :peptide-trust="activeTrust"
                    :communication-source="activeCommunicationSource">
                </analysis-summary>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <single-dataset-visualizations-card
                    :peptide-count-table="activeCountTable"
                    :search-configuration="activeAssay ? activeAssay.getSearchConfiguration() : undefined"
                    :analysisInProgress="true"
                    :communication-source="activeCommunicationSource"
                    v-on:update-selected-term="onUpdateSelectedTerm"
                    v-on:update-selected-taxon-id="onUpdateSelectedTaxonId">
                </single-dataset-visualizations-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <functional-summary-card
                    :peptide-count-table="activeCountTable"
                    :communication-source="activeCommunicationSource"
                    :search-configuration="activeAssay ? activeAssay.getSearchConfiguration() : undefined"
                    :analysisInProgress="true"
                    :selectedTaxonId="$store.getters.getSelectedTaxonId">
                </functional-summary-card>
            </v-col>
        </v-row>
    </v-container>
    <v-container fluid v-else class="status-container">
        <div class="inner-status-container" v-if="errorStatus">
            <v-icon x-large>
                mdi-wifi-strength-4-alert
            </v-icon>
            <p>
                A network communication error occurred while processing this assay. Please check that you
                are connected to the internet, or that your Unipept API-endpoint is correctly set and
                <a @click="reanalyse()">try again.</a>
            </p>
        </div>
        <div class="d-flex flex-column mt-12" style="max-width: 1000px;" v-else-if="$store.getters.getProject.getAllAssays().length === 0">
            <h2>Empty project</h2>
            <p>
                You have created an empty project. If this is the first time you're using this application, you can use
                the following steps as a guide to get started.
            </p>
            <h3>1. Create a new study</h3>
            <p class="font-italic font-weight-light">
                A study is a central concept that contains information about the subject that's under investigation.
                It's a collection of assays with extra contextual information about these assays.
            </p>
            <p class="font-weight-medium">
                Click the "Create assay" button in the sidebar to the left to create a new study. This is the big blue
                button situated at the bottom of the sidebar.
            </p>
            <h3>2. Add an assay to your study</h3>
            <p class="font-italic font-weight-light">
                An assay corresponds to one experiment executed on a piece of material or a dataset. In the case of
                metaproteomics, an assay corresponds to a list of peptides with a specific search configuration that
                can directly be processed by this application.
            </p>
            <p class="font-weight-medium">
                After you've created a new study, you need to import a list of peptides that you want to process. Click
                the <v-icon small style="position: relative; bottom: 1px;" color="grey darken-3">
                mdi-file-plus-outline</v-icon> button next to the study to which your new assay should belong.
            </p>
            <p class="font-italic">
                Tip: you can create as many studies and assays as you'd like.
            </p>
        </div>
        <div class="inner-status-container game-container mt-12" v-else-if="maxProgress < 1 || activeProgress < 1" >
            <v-progress-circular
                :size="100"
                :rotate="-90"
                :width="15"
                :value="(activeAssay ? activeProgress : maxProgress) * 100"
                color="primary">
                {{ Math.round((activeAssay ? activeProgress : maxProgress) * 100) }}%
            </v-progress-circular>
            <p class="mt-4">
                {{ activeEta ? secondsToTimeString(activeEta) : secondsToTimeString(minEta) }}
            </p>
            <div class="mt-12">
                <snake></snake>
            </div>
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
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import Snake from "./../games/Snake.vue";


@Component({
    components: {
        AnalysisSummary,
        SingleDatasetVisualizationsCard,
        FunctionalSummaryCard,
        Snake
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
                }
                return undefined;
            }
        },
        activeTrust: {
            get(): PeptideTrust {
                if (this.activeAssay) {
                    return this.$store.getters.getProject.getProcessingResults(this.activeAssay).trust;
                }
                return undefined;
            }
        },
        activeCommunicationSource: {
            get(): CommunicationSource {
                if (this.activeAssay) {
                    return this.$store.getters.getProject.getProcessingResults(this.activeAssay).communicators;
                }
                return undefined;
            }
        },
        errorStatus: {
            get(): boolean {
                if (!this.activeAssay) {
                    return false;
                }
                return this.$store.getters.getProject.getProcessingResults(this.activeAssay).errorStatus !== undefined;
            }
        },
        maxProgress: {
            get(): number {
                return this.$store.getters.getProject.getAllAssays().reduce((acc, curr) => {
                    const progressResult = this.$store.getters.getProject.getProcessingResults(curr).progress;
                    if (progressResult && progressResult > acc) {
                        return progressResult;
                    } else {
                        return acc;
                    }
                }, 0);
            }
        },
        minEta: {
            get(): number {
                return this.$store.getters.getProject.getAllAssays().reduce((acc, curr) => {
                    const eta = this.$store.getters.getProject.getProcessingResults(curr).eta;
                    if (eta < acc) {
                        return eta;
                    }
                }, Infinity);
            }
        },
        activeProgress: {
            get(): number {
                if (!this.activeAssay) {
                    return 0;
                }
                return this.$store.getters.getProject.getProcessingResults(this.activeAssay).progress;
            }
        },
        activeEta: {
            get(): number {
                if (!this.activeAssay) {
                    return 0;
                }
                return this.$store.getters.getProject.getProcessingResults(this.activeAssay).eta;
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

    private secondsToTimeString(time: number): string {
        if (time && !isNaN(time) && time !== Infinity) {
            const date = new Date(time * 1000);
            let timeString = "";
            if (date.getHours() - 1 > 0) {
                timeString = `${date.getHours() - 1} hours, ${date.getMinutes()} minutes and ${date.getSeconds()} seconds`;
            } else if (date.getMinutes() > 0) {
                timeString = `${date.getMinutes()} minutes and ${date.getSeconds()} seconds`;
            } else {
                timeString = `${date.getSeconds()} seconds`;
            }
            return `Approximately ${timeString} remaining...`;
        } else {
            return "Computing estimated time remaining...";
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

    .inner-status-container {
        max-width: 600px;
        display: flex;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        align-items: center;
    }

    .game-container {
        justify-content: flex-start;
    }

    .status-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        /*align-items: center;*/
    }
</style>
