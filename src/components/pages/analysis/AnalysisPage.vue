<template>
    <div>
        <project-explorer v-on:widthChange="explorerWidthChanged" v-on:createAssay="createAssay"></project-explorer>

        <div
            :style="{
                'width': `calc(100vw - 55px - ${explorerWidth}px)`,
                'float': 'right'
            }">

            <v-alert type="warning" class="ma-2" v-if="isDemoProjectActive">
                You are currently browsing the demo project. Changes made to this project will not be saved.
            </v-alert>

            <v-alert
                v-if="isFilterActive && filteredTrust"
                class="ma-2"
                type="info">
                <v-row dense align="center">
                    <v-col class="grow">
                        <b>
                            Filtered results:
                        </b>
                        these results are limited to the {{ this.filteredTrust.matchedPeptides }} peptides specific to
                        <b>
                            {{ this.filteredNcbiTaxon.name }} ({{this.filteredNcbiTaxon.rank}})
                        </b>
                    </v-col>
                    <v-col class="shrink">
                        <v-btn @click="resetFilter" color="white" class="black--text" x-small>Reset filter</v-btn>
                    </v-col>
                </v-row>
            </v-alert>

            <!-- Show analysis results for the currently selected assay if it's ready with processing -->
            <v-container
                v-if="!errorStatus && activeAssay && activeAssay.analysisReady"
                fluid
                class="pt-0">

                <router-view></router-view>
            </v-container>

            <!-- Show progress information / help information / ... when processing is not done yet -->
            <v-container
                v-else
                fluid
                class="status-container">

                <!-- Show extensive error message about error that might have happened during analysis of an assay. -->
                <v-alert v-if="errorStatus" prominent type="error" text>
                    <div class="mb-4">
                        An unexpected error has occurred during the analysis of this assay. Details about this specific
                        error are shown below. You can <a @click="reanalyse">restart</a> the analysis to try again. If
                        you believe that this error is not the result of a user action, then please contact us and
                        provide the error details below. Make sure to check your internet connection before continuing.
                    </div>

                    <div class="font-weight-bold">Error details</div>
                    <textarea
                        :value="errorObject ? errorObject.stack : this.errorMessage"
                        class="logview pa-2"
                        disabled />
                </v-alert>

                <!-- Show message that informs the user that the analysis of this assay has been cancelled. -->
                <v-alert v-else-if="cancelled" prominent type="warning" text  icon="mdi-motion-pause">
                    You chose to cancel the analysis of this assay. <a @click="reanalyse">Click here</a> to restart this
                    assay's analysis. Previously generated analysis results
                    <span class="font-weight-bold">will be lost</span> if the analysis is restarted. The analysis of
                    this assay will be scheduled to start after all currently active analysis processes have finished.
                </v-alert>

                <div
                    v-else-if="$store.getters.assays.length === 0"
                    class="d-flex flex-column mt-12"
                    style="max-width: 1000px;">
                    <h2>Empty project</h2>
                    <p>
                        You have created an empty project. If this is the first time you're using this application, you can use
                        the following steps as a guide to get started.
                    </p>
                    <h3>
                        1. Create a new
                        <v-tooltip bottom open-delay="500" max-width="500px">
                            <template v-slot:activator="{ on, attrs }">
                                <span v-on="on" class="tooltip-text">
                                    study
                                </span>
                            </template>
                            <span>
                                A study is a central concept that contains information about the subject that's
                                under investigation. It's a collection of assays with extra contextual information
                                about these assays.
                            </span>
                        </v-tooltip>
                    </h3>
                    <p class="mt-1">
                        Click the "Create study" button in the sidebar to the left to create a new study. This is the big blue
                        button situated at the bottom of the sidebar.
                    </p>
                    <h3>
                        2. Add an
                        <v-tooltip bottom open-delay="500" max-width="500px">
                            <template v-slot:activator="{ on, attrs }">
                                <span v-on="on" class="tooltip-text">
                                    assay
                                </span>
                            </template>
                            <span>
                                An assay corresponds to a list of peptides with a specific search configuration that
                                can directly be processed by this application.
                            </span>
                        </v-tooltip>
                        to your study
                    </h3>
                    <p class="mt-1">
                        After you've created a new study, you need to import a list of peptides that you want to process. Click
                        the <v-icon small style="position: relative; bottom: 1px;" color="grey darken-3">
                        mdi-file-plus-outline</v-icon> button next to the study to which your new assay should belong.
                    </p>
                </div>

                <div v-else-if="activeAssay ? !activeAssay.analysisReady : false">
                    <div v-if="activeAssay.analysisInProgress" class="inner-status-container mt-12">
                        <div class="d-flex">
                            <div style="max-width: 500px;">
                                <v-progress-circular
                                    color="primary"
                                    size="80"
                                    width="10"
                                    :rotate="activeProgress.currentValue === -1 ? 0 : -90"
                                    :indeterminate="activeProgress.currentValue === -1"
                                    :value="activeProgress.currentValue"
                                >
                                <span v-if="activeProgress.currentValue !== -1">
                                    {{ Math.round(activeProgress.currentValue) }}%
                                </span>
                                </v-progress-circular>
                                <div class="mt-4">
                                    {{ activeProgress.eta !== -1 ? `Approximately ${msToTimeString(activeProgress.eta)} remaining.` : "Computing estimated time remaining..." }}
                                </div>
                                <div class="mb-4">
                                    Analysis started {{ msToTimeString(currentTime - activeProgress.startTimes[0]) }} ago.
                                </div>
                                <div>
                                    Note that assays are processed sequentially and that the estimated time is only computed once the
                                    analysis for this assay has been started.
                                </div>
                            </div>
                            <v-divider vertical class="mx-8"></v-divider>
                            <progress-report-summary
                                :progress-report="activeProgress">
                            </progress-report-summary>
                        </div>
                    </div>

                    <!-- Show information that this assay is queued for processing -->
                    <v-alert v-else prominent type="info" text icon="mdi-progress-clock">
                        This assay is queued for analysis. Only one analysis will be analysed by this application at a
                        time. Note, however, that parallelism at the single assay analysis level is present in order to
                        maximize the usage of your system's available resources. You will see the progress of this
                        assay's analysis once the actual analysis process has started.
                    </v-alert>

                    <div class="mt-12 d-flex justify-center">
                        <snake></snake>
                    </div>
                </div>
            </v-container>
        </div>

        <create-assay-dialog v-model="createAssayDialogActive" :study="studyForCreation"></create-assay-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
    ProteomicsAssay,
    AssayAnalysisStatus,
    StringUtils,
    Study,
    ProgressReport,
    PeptideTrust, NcbiTaxon, Ontology, NcbiId
} from "unipept-web-components";
import Snake from "@/components/games/Snake.vue";
import Toolbar from "@/components/navigation-drawers/Toolbar.vue";
import ProjectExplorer from "@/components/navigation-drawers/ProjectExplorer.vue";
import SearchConfigurationDialog from "@/components/dialogs/SearchConfigurationDialog.vue";
import CreateAssayDialog from "@/components/assay/CreateAssayDialog.vue";
import ProgressReportSummary from "@/components/analysis/ProgressReportSummary.vue";
import { Watch } from "vue-property-decorator";

const { app } = require("@electron/remote");

@Component({
    components: {
        ProgressReportSummary,
        SearchConfigurationDialog,
        Snake,
        Toolbar,
        ProjectExplorer,
        CreateAssayDialog
    }
})
export default class AnalysisPage extends Vue {
    private explorerWidth = 210;

    private createAssayDialogActive = false;

    // The Study object to which new assays should be added.
    private studyForCreation: Study = null;

    private currentTime: number = new Date().getTime();

    get activeAssay(): AssayAnalysisStatus {
        return this.$store.getters.activeAssay;
    }

    get errorStatus(): boolean {
        if (!this.activeAssay) {
            return false;
        }
        return this.activeAssay?.error?.status;
    }

    get errorMessage(): string {
        return this.activeAssay?.error?.message;
    }

    get errorObject(): Error | undefined {
        return this.activeAssay?.error?.object;
    }

    get cancelled(): boolean {
        // TODO implement
        return false;
        // return this.$store.getters.assayData(this.activeAssay)?.analysisMetaData.status === "cancelled";
    }

    get activeProgress(): ProgressReport | undefined {
        // const item = this.activeAssay?.progress;
        // item.currentValue = 45;
        // return item;
        return this.activeAssay?.originalProgress;
    }

    get isDemoProjectActive(): boolean {
        const projectLocation: string = this.$store.getters.projectLocation;
        const tempPath: string = app.getPath("temp");
        return projectLocation && projectLocation.includes(tempPath);
    }

    get filteredId(): NcbiId {
        return this.activeAssay?.filterId;
    }

    get isFilterActive(): boolean {
        return this.filteredId !== 1;
    }

    get filteredTrust(): PeptideTrust {
        return this.activeAssay?.filteredData?.trust;
    }

    get ncbiOntology(): Ontology<NcbiId, NcbiTaxon> {
        return this.activeAssay?.ncbiOntology;
    }

    get filteredNcbiTaxon(): NcbiTaxon {
        return this.ncbiOntology.getDefinition(this.filteredId);
    }

    private reanalyse() {
        if (this.activeAssay) {
            this.$store.dispatch("analyseAssay", this.activeAssay.assay);
        }
    }

    mounted() {
        setInterval(() => {
            this.currentTime = new Date().getTime();
        }, 1000);
    }

    private explorerWidthChanged(value: number) {
        this.explorerWidth = value;
    }

    private createAssay(study: Study) {
        this.studyForCreation = study;
        this.createAssayDialogActive = true;
    }

    private msToTimeString(ms: number) {
        return StringUtils.secondsToTimeString(ms / 1000);
    }

    private resetFilter() {
        this.$store.dispatch("filterAssayByTaxon", [this.activeAssay.assay, 1]);
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
        max-width: 1200px;
        display: flex;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        align-items: center;
    }


    .status-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        /*align-items: center;*/
    }

    .logview {
        background-color: #1a1a1a;
        color: white;
        font-family: "Roboto mono", monospace;
        width: 100%;
        min-height: 300px;
    }

    .tooltip-text {
        text-decoration: underline;
        text-decoration-style: dotted;
        text-underline-position: under;
    }
</style>
