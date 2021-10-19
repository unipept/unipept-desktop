<template>
    <div>
        <project-explorer v-on:widthChange="explorerWidthChanged" v-on:createAssay="createAssay"></project-explorer>

        <div
            :style="{
                'width': `calc(100vw - 55px - ${explorerWidth}px)`,
                'float': 'right'
            }">
            <v-container
                v-if="!errorStatus && $store.getters.assays.length > 0 && (maxProgress === 1 && activeProgress === 1)"
                fluid
                class="pt-0">
                <router-view></router-view>
            </v-container>

            <v-container
                v-else
                fluid
                class="status-container">
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
                <div class="d-flex flex-column mt-12" style="max-width: 1000px;" v-else-if="$store.getters.assays.length === 0">
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
                        Click the "Create study" button in the sidebar to the left to create a new study. This is the big blue
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

                <div class="inner-status-container mt-12" v-else-if="cancelled">
                    <v-icon x-large>mdi-cancel</v-icon>
                    <p>
                        You chose to cancel the analysis of this assay. <a @click="reanalyse">Click here</a> to restart this
                        assay's analysis.
                    </p>
                </div>

                <div class="inner-status-container game-container mt-12" v-else-if="activeAssay ? !activeAssay.analysisReady : false" >
                    <v-progress-circular
                        :size="100"
                        :rotate="-90"
                        :width="15"
                        :value="(activeAssay ? activeAssay.progress.value : 0) * 100"
                        color="primary">
                        {{ Math.round((activeAssay ? activeProgress : maxProgress) * 100) }}%
                    </v-progress-circular>
                    <p class="mt-4">
                        {{ activeEta ? secondsToTimeString(activeEta) : secondsToTimeString(minEta) }}
                    </p>
                    <p>
                        Note that assays are processed sequentially and that the estimated time is only computed once the
                        analysis for this assay has been started.
                    </p>
                    <div class="mt-12">
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
import { ProteomicsAssay, AssayAnalysisStatus, StringUtils, Study } from "unipept-web-components";
import Snake from "@/components/games/Snake.vue";
import Toolbar from "@/components/navigation-drawers/Toolbar.vue";
import ProjectExplorer from "@/components/navigation-drawers/ProjectExplorer.vue";
import SearchConfigurationDialog from "@/components/dialogs/SearchConfigurationDialog.vue";
import CreateAssayDialog from "@/components/assay/CreateAssayDialog.vue";

@Component({
    components: {
        SearchConfigurationDialog,
        Snake,
        Toolbar,
        ProjectExplorer,
        CreateAssayDialog
    }
})
export default class AnalysisPage extends Vue {
    private explorerWidth: number = 210;

    private createAssayDialogActive: boolean = false;

    // The Study object to which new assays should be added.
    private studyForCreation: Study = null;

    get activeAssay(): AssayAnalysisStatus {
        return this.$store.getters.activeAssay;
    }

    get errorStatus(): boolean {
        if (!this.activeAssay) {
            return false;
        }
        return this.$store.getters.assayData(this.activeAssay)?.error.status;
    }

    get cancelled(): boolean {
        // TODO implement
        return false;
        // return this.$store.getters.assayData(this.activeAssay)?.analysisMetaData.status === "cancelled";
    }

    get maxProgress(): number {
        return this.$store.getters.assays.reduce((acc: number, curr: AssayAnalysisStatus) => {
            const progressResult = curr.progress.value;
            if (progressResult && progressResult > acc) {
                return progressResult;
            } else {
                return acc;
            }
        }, 0);
    }

    get activeProgress(): number {
        if (!this.activeAssay) {
            return 0;
        }
        return this.$store.getters.assayData(this.activeAssay)?.progress.value;
    }

    get minEta(): number {
        return this.$store.getters.assays.reduce((acc: number, curr: AssayAnalysisStatus) => {
            const eta = curr.progress.eta;
            if (eta < acc) {
                return eta;
            }
        }, Infinity);
    }

    get activeEta(): number {
        if (!this.activeAssay) {
            return 0;
        }
        return this.$store.getters.assayData(this.activeAssay)?.progress.eta;
    }

    private reanalyse() {
        // if (this.activeAssay) {
        //     this.$store.dispatch("analyseAssay", [
        //         this.activeAssay,
        //         true,
        //         this.activeAssay.getSearchConfiguration()
        //     ]);
        // }
    }

    private secondsToTimeString(time: number): string {
        return StringUtils.secondsToTimeString(time);
    }

    private explorerWidthChanged(value: number) {
        this.explorerWidth = value;
    }

    private createAssay(study: Study) {
        this.studyForCreation = study;
        this.createAssayDialogActive = true;
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
