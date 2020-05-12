<template>
    <div>
        <div
            @click="selectAssay()"
            @contextmenu="showContextMenu()"
            :class="{
                'assay-item': true,
                'assay-item--selected': activeAssay && activeAssay.getId() === assay.getId(),
                'assay-item--error': !isValidAssayName || errorStatus
            }">
            <div
                v-if="isValidAssayName && !errorStatus">
                <v-tooltip bottom v-if="progress !== 1">
                    <template v-slot:activator="{ on }">
                        <v-progress-circular
                            :rotate="-90" :size="16"
                            :value="progress * 100"
                            v-on="on"
                            color="primary">
                        </v-progress-circular>
                    </template>
                    <span>{{ Math.round(progress * 100) }}%</span>
                </v-tooltip>
                <v-icon
                    v-else
                    color="#424242"
                    size="20">
                    mdi-text-box-outline
                </v-icon>
            </div>
            <tooltip
                v-if="!isValidAssayName"
                :message="nameError"
                position="bottom">
                <v-icon
                    @click="() => {}"
                    size="20"
                    color="red">
                    mdi-alert-outline
                </v-icon>
            </tooltip>
            <tooltip
                v-if="errorStatus"
                message="A network communication error occurred while processing this assay. Click here to try again."
                position="bottom">
                <v-icon
                    @click="reanalyse()"
                    size="20"
                    color="red">
                    mdi-restart-alert
                </v-icon>
            </tooltip>
            <span
                v-if="!isEditingAssayName"
                v-on:dblclick="enableAssayEdit()">
                {{ assay.getName() }}
            </span>
            <input
                v-else
                v-model="assayName"
                v-on:blur="disableAssayEdit()"
                v-on:keyup.enter="disableAssayEdit()"
                :class="{ 'error-item': !isValidAssayName }"
                type="text"/>
            <div style="display: flex; flex-direction: row; margin-left: auto; margin-right: 8px;">
                <tooltip message="Display experiment summary." position="bottom">
                    <v-icon
                        :disabled="project.getProcessingResults(assay).progress !== 1"
                        @click="experimentSummaryActive = true"
                        v-on:click.stop color="#424242"
                        size="20">
                        mdi-information-outline
                    </v-icon>
                </tooltip>
            </div>
        </div>
        <experiment-summary-dialog
            :peptide-trust="peptideTrust"
            :active.sync="experimentSummaryActive">
        </experiment-summary-dialog>
        <v-dialog v-model="removeConfirmationActive" width="600">
            <v-card>
                <v-card-title>Confirm assay deletion</v-card-title>
                <v-card-text>
                    Are you sure you want to permanently delete this assay? This action cannot be undone.
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="removeConfirmationActive = false">Cancel</v-btn>
                    <v-btn text color="red" @click="removeAssay()">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import ExperimentSummaryDialog from "./../analysis/ExperimentSummaryDialog.vue";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";
import Study from "unipept-web-components/src/business/entities/study/Study";
import PeptideCountTableProcessor from "unipept-web-components/src/business/processors/raw/PeptideCountTableProcessor";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import Project from "@/logic/filesystem/project/Project";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import DefaultCommunicationSource from "unipept-web-components/src/business/communication/source/DefaultCommunicationSource";


const { remote } = require("electron");
const { Menu, MenuItem } = remote;

@Component({
    components: {
        Tooltip,
        ExperimentSummaryDialog
    },
    computed: {
        progress: {
            get(): number {
                return this.project.getProcessingResults(this.assay).progress;
            }
        },
        errorStatus: {
            get(): boolean {
                return this.project.getProcessingResults(this.assay).errorStatus;
            }
        }
    }
})
export default class AssayItem extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: true })
    private activeAssay: ProteomicsAssay;
    @Prop({ required: true })
    private study: Study;
    @Prop({ required: true })
    private project: Project;

    private peptideTrust: PeptideTrust = null;
    private experimentSummaryActive: boolean = false;
    private removeConfirmationActive: boolean = false;
    private isEditingAssayName: boolean = false;
    private isValidAssayName: boolean = true;

    private assayName: string = "";

    private nameError: string = "";

    mounted() {
        this.onAssayChanged();
    }

    private enableAssayEdit() {
        this.isEditingAssayName = true;

    }

    private disableAssayEdit() {
        if (this.checkAssayNameValidity()) {
            this.isEditingAssayName = false;
            this.assay.setName(this.assayName);
        }
    }

    private showContextMenu() {
        const menu = new Menu()
        menu.append(new MenuItem({
            label: "Rename",
            click: () => {
                this.enableAssayEdit();
            }
        }));
        menu.append(new MenuItem({ type: "separator" }))
        menu.append(new MenuItem({
            label: "Duplicate",
            click: () => {

            }
        }));
        menu.append(new MenuItem({
            label: "Delete",
            click: () => {
                this.removeConfirmationActive = true;
            }
        }));
        menu.popup();
    }

    @Watch("assayName")
    private checkAssayNameValidity(): boolean {
        if (this.assayName === "") {
            this.nameError = "Name cannot be empty.";
            this.isValidAssayName = false;
            return false;
        }

        const nameExists: boolean = this.study.getAssays()
            .map(s => s.getName().toLocaleLowerCase())
            .indexOf(this.assayName.toLocaleLowerCase()) !== -1;

        if ((nameExists && this.assay.getName() !== this.assayName)) {
            this.nameError = "A study with this name already exists.";
            this.isValidAssayName = false;
            return false;
        }

        this.isValidAssayName = true;
        return true;
    }

    @Watch("assay")
    @Watch("progress")
    private async onAssayChanged() {
        this.assayName = this.assay.getName();
        this.peptideTrust = await this.computePeptideTrust();
    }

    private async computePeptideTrust(): Promise<PeptideTrust> {
        if (this.assay) {
            const processingResults = this.project.getProcessingResults(this.assay);
            const communicators = processingResults.communicators;
            const peptideCounts = processingResults.countTable;

            if (communicators && peptideCounts) {
                const pept2DataCommunicator = communicators.getPept2DataCommunicator();
                await pept2DataCommunicator.process(peptideCounts, this.assay.getSearchConfiguration());
                return await pept2DataCommunicator.getPeptideTrust(peptideCounts, this.assay.getSearchConfiguration());
            }
        }
        return undefined;
    }

    private reanalyse() {
        this.project.processAssay(this.assay);
    }

    private selectAssay() {
        this.$emit("select-assay", this.assay);
    }

    private removeAssay() {
        this.$emit("remove-assay", this.assay);
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/assay-item.css.less";
</style>
