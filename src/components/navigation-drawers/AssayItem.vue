<template>
    <div>
        <div
            @click="clickCheckbox()"
            @contextmenu="showContextMenu()"
            :class="{
                'assay-item': true,
                'assay-item--selected': !selectable && activeAssay && activeAssay.getId() === assay.getId(),
                'assay-item--error': !isValidAssayName || errorStatus
            }">
            <div v-if="isValidAssayName && !errorStatus && !cancelStatus">
                <v-tooltip bottom v-if="progress !== 1">
                    <template v-slot:activator="{ on }">
                        <v-progress-circular
                            :rotate="-90" :size="18"
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
            <tooltip
                v-if="cancelStatus"
                message="The analysis for this assay has been cancelled. Click here to restart the analysis."
                position="bottom">
                <v-icon
                    @click="reanalyse()"
                    size="20">
                    mdi-cancel
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
            <div style="display: flex; flex-direction: row; margin-left: auto; height: 32px;" v-if="selectable">
                <tooltip message="Add assay to comparative analysis." position="bottom">
                    <v-checkbox
                        :value="selected"
                        @change="clickCheckbox"
                        dense
                        @click.native.stop
                        :disabled="progress !== 1">
                    </v-checkbox>
                </tooltip>
            </div>
            <div
                style="display: flex; flex-direction: row; margin-left: auto; margin-right: 8px;"
                v-else-if="progress === 1">
                <tooltip message="Display experiment summary." position="bottom">
                    <v-icon
                        @click="experimentSummaryActive = true"
                        v-on:click.stop
                        color="#424242"
                        size="20">
                        mdi-information-outline
                    </v-icon>
                </tooltip>
            </div>
            <div
                style="display: flex; flex-direction: row; margin-left: auto; margin-right: 8px;"
                v-else-if="cancelStatus">
                <v-icon
                    color="#424242"
                    size="20"
                    disabled>
                    mdi-close
                </v-icon>
            </div>
            <div style="display: flex; flex-direction: row; margin-left: auto; margin-right: 8px;" v-else>
                <tooltip message="Cancel analysis" position="bottom">
                    <v-icon
                        @click="cancelAnalysis()"
                        v-on:click.stop color="#424242"
                        size="20">
                        mdi-stop-circle-outline
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
import {
    Tooltip,
    PeptideTrust,
    Study,
    ProteomicsAssay,
    SearchConfiguration,
    Pept2DataCommunicator,
    CountTable,
    Peptide,
    Assay,
    AssayData
} from "unipept-web-components";

import ExperimentSummaryDialog from "./../analysis/ExperimentSummaryDialog.vue";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";

const { remote } = require("electron");
const { Menu, MenuItem } = remote;

@Component({
    components: {
        Tooltip,
        ExperimentSummaryDialog
    }
})
export default class AssayItem extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: true })
    private study: Study;
    /**
     * Can the assay be selected for a comparative analysis?
     */
    @Prop({ required: false, default: false })
    private selectable: boolean;
    /**
     * Is the assay currently selected or not?
     */
    @Prop({ required: false, default: false })
    private value: boolean;

    private peptideTrust: PeptideTrust = null;
    private experimentSummaryActive: boolean = false;
    private removeConfirmationActive: boolean = false;
    private isEditingAssayName: boolean = false;
    private isValidAssayName: boolean = true;

    // Is this assay currently selected for a comparative analysis?
    private selected: boolean = false;

    private assayName: string = "";

    private nameError: string = "";

    mounted() {
        this.onAssayChanged();
        this.onValueChanged();
    }

    get activeAssay(): ProteomicsAssay {
        return this.$store.getters.activeAssay;
    }

    get progress(): number {
        const assayData: AssayData = this.$store.getters.assayData(this.assay);
        return assayData ? assayData.analysisMetaData.progress : 0;
    }

    get peptideCountTable(): CountTable<Peptide> {
        return this.$store.getters.assayData(this.assay)?.peptideCountTable;
    }

    get errorStatus(): boolean {
        const assayData: AssayData = this.$store.getters.assayData(this.assay);
        return assayData?.analysisMetaData.status === "error";
    }

    get cancelStatus(): boolean {
        const assayData: AssayData = this.$store.getters.assayData(this.assay);
        return assayData?.analysisMetaData.status === "cancelled";
    }

    get pept2dataCommunicator(): Pept2DataCommunicator {
        const processingResult = this.$store.getters.assayData(this.assay);
        return processingResult?.communicationSource?.getPept2DataCommunicator();
    }

    private cancelAnalysis() {
        this.$store.dispatch("cancelAnalysis", this.assay);
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
                this.duplicateAssay();
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

    @Watch("value")
    private onValueChanged() {
        this.selected = this.value;
    }

    private clickCheckbox() {
        this.selected = !this.selected;
        this.$emit("input", this.selected);
    }

    @Watch("assay", { immediate: true })
    private async onAssayChanged() {
        this.assayName = this.assay.getName();
    }

    @Watch("pept2dataCommunicator", { immediate: true })
    private async computePeptideTrust(): Promise<void> {
        if (this.assay && this.pept2dataCommunicator) {
            const processingResult = this.$store.getters.assayData(this.assay);
            const countTable = processingResult?.peptideCountTable;
            this.peptideTrust = await this.pept2dataCommunicator.getPeptideTrust(
                countTable,
                this.assay.getSearchConfiguration()
            );
        }
    }

    private reanalyse() {
        this.$store.dispatch("processAssay", [this.assay, true]);
    }

    private async duplicateAssay() {
        let assayName = this.assay.getName();

        // Check if assay with same name already exists in the list of assays for this study. If so, change the name
        // to make it unique.
        let otherAssayWithName = this.study.getAssays().find(a => a.getName() === assayName);
        if (otherAssayWithName) {
            // Append a number to the assay to make it unique. An assay with this name might again already exist, which
            // is why we need to check for uniqueness in a loop.
            let counter = 1;
            let newName: string;
            while (otherAssayWithName) {
                newName = `${assayName} (${counter})`;
                otherAssayWithName = this.study.getAssays().find((a: Assay) => a.getName() === newName);
                counter++;
            }
            assayName = newName;
        }

        // Also copy configuration for this assay.
        const newAssay = new ProteomicsAssay(uuidv4());
        newAssay.setName(assayName);
        const originalSearchConfig = this.assay.getSearchConfiguration();
        const searchConfiguration = new SearchConfiguration(
            originalSearchConfig.equateIl,
            originalSearchConfig.filterDuplicates,
            originalSearchConfig.enableMissingCleavageHandling
        );
        newAssay.setSearchConfiguration(searchConfiguration);
        const metadataWriter = new AssayFileSystemMetaDataWriter(
            `${this.$store.getters.projectLocation}${this.study.getName()}`,
            this.$store.getters.dbManager,
            this.study
        );
        await newAssay.accept(metadataWriter);

        await fs.copyFile(
            `${this.$store.getters.projectLocation}${this.study.getName()}/${this.assay.getName()}.pep`,
            `${this.$store.getters.projectLocation}${this.study.getName()}/${assayName}.pep`,
        );
    }

    private async removeAssay() {
        this.removeConfirmationActive = false;
        const assayDestroyer = new AssayFileSystemDestroyer(
            `${this.$store.getters.projectLocation}${this.study.getName()}`,
            this.$store.getters.dbManager
        );
        await this.assay.accept(assayDestroyer);
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/assay-item.css.less";
</style>
