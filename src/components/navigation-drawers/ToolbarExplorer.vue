<template>
    <div>
        <div 
            class="sample-list-placeholder" 
            v-if="!project || project.getStudies().length === 0">
            No studies present.
        </div>
        <div v-else v-for="study of project.getStudies()" :key="study.getId()">
            <div class="study-item">
                <v-icon 
                    color="#424242" 
                    style="padding-left: 8px;">
                    mdi-chevron-down
                </v-icon>
                <input class="study-item-name" type="text" v-model="study.name" />
                <v-icon 
                    color="#424242" 
                    size="20" 
                    style="margin-left: auto;"
                    @click="createAssay(study)">
                    mdi-file-plus-outline
                </v-icon>
            </div>
            <div class="assay-items" v-if="study.getAssays().length > 0">
                <div class="assay-item" v-for="assay of study.getAssays()" :key="assay.getId()">
                    <v-progress-circular 
                        v-if="assay.progress !== 1" 
                        :rotate="-90" :size="16" 
                        :value="assay.progress * 100" 
                        color="primary">
                    </v-progress-circular>
                    <v-icon
                        color="#424242"
                        size="20"
                        v-if="assay.progress === 1">
                        mdi-file-document-box-outline
                    </v-icon>
                    <span>{{ assay.getName() }}</span>
                    <div style="display: flex; flex-direction: row; margin-left: auto;">
                        <tooltip message="Display experiment summary." position="bottom">
                            <v-icon :disabled="assay.progress !== 1" @click="showExperimentSummary(assay)" v-on:click.stop color="#424242" size="20">mdi-information-outline</v-icon>
                        </tooltip>
                        <tooltip message="Remove assay from analysis." position="bottom">
                            <v-icon :disabled="assay.progress !== 1" @click="deselectAssay(assay)" v-on:click.stop color="#424242" size="20">mdi-close</v-icon>
                        </tooltip>
                    </div>
                </div>
            </div>
            <!-- <v-list dense v-if="study.getAssays().length > 0">
                <v-list-item 
                    :class="{'v-list-item--active': $store.getters.getActiveAssay === assay}" 
                    @click="activateAssay(assay)" v-for="assay of study.getAssays()" 
                    :key="assay.getId()">
                    <v-list-item-title>
                        {{ assay.getName() }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ assay.getAmountOfPeptides() }} peptides
                    </v-list-item-subtitle>
                    <v-list-item-action>
                        <v-progress-circular 
                            v-if="assay.progress !== 1" 
                            :rotate="-90" :size="18" 
                            :value="assay.progress * 100" 
                            color="primary">
                        </v-progress-circular>
                        <div v-else style="display: flex; flex-direction: row;">
                            <tooltip message="Display experiment summary." position="bottom">
                                <v-icon @click="showExperimentSummary(assay)" v-on:click.stop small>mdi-information-outline</v-icon>
                            </tooltip>
                            <tooltip message="Remove assay from analysis." position="bottom">
                                <v-icon @click="deselectAssay(assay)" v-on:click.stop small>mdi-close</v-icon>
                            </tooltip>
                        </div>
                    </v-list-item-action>
                </v-list-item>
            </v-list> -->
        </div>
        <v-btn class="select-sample-button" depressed color="primary" @click="createStudy()">
            Create study
        </v-btn>

        <experiment-summary-dialog 
            :assay="summaryDataset"
            :active.sync="summaryActive">
        </experiment-summary-dialog>
        <v-dialog v-model="selectSampleDialog" max-width="800" v-if="selectedStudy">
            <v-card>
                <v-card-title>
                    Sample selection
                </v-card-title>
                <load-datasets-card 
                    :study="selectedStudy" 
                    v-on:create-assay="onCreateAssay">
                </load-datasets-card>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import Project from "unipept-web-components/src/logic/data-management/project/Project";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import ExperimentSummaryDialog from "./../analysis/ExperimentSummaryDialog.vue";
import LoadDatasetsCard from "../dataset/LoadDatasetsCard.vue";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";

@Component({
    components: {
        ExperimentSummaryDialog,
        LoadDatasetsCard,
        Tooltip
    }
})
export default class ToolbarExplorer extends Vue {
    @Prop({ required: true })
    private project: Project;
    
    private selectSampleDialog: boolean = false;

    private summaryActive: boolean = false;
    private summaryDataset: Assay = null;

    private selectedStudy: Study = null;

    private showExperimentSummary(dataset) {
        this.summaryDataset = dataset;
        this.summaryActive = true;
    }

    private activateAssay(assay: Assay) {
        this.$store.dispatch("setActiveAssay", assay);
    }

    private createAssay(study: Study) {
        this.selectedStudy = study;
        this.selectSampleDialog = true;
    }

    private createStudy() {
        if (this.project !== null) {
            this.project.createStudy();
        }
    }

    private onCreateAssay(assay: Assay) {
        // Close the datasets card
        this.selectSampleDialog = false;
        console.log(this.selectedStudy);
        // Process the newly selected assay
        this.$store.dispatch("processAssay", assay);
    }
}
</script>

<style>
    .sample-list-placeholder {
        margin-left: 8px; 
        margin-right: 8px;
        position: relative;
        top: 16px;
        text-align: center;
    }

    .assay-items {
        margin-left: 16px;
    }

    .study-item {
        display: flex;
        align-items: center;
        background-color: #eee; 
        color: #424242; 
        font-weight: 700;
    }

    .assay-item {
        display: flex;
        align-items: center;
        color: #424242;
        font-weight: 700;
    }

    .assay-item > span {
        margin-left: 8px;
    }

    .study-item-name {
        font-size: 16px;
        flex: 1;
        /* text-transform: uppercase;  */
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
