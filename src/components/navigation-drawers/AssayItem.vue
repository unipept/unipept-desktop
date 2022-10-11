<template>
    <div>
        <div
            @click="selectAssay()"
            @contextmenu="showContextMenu()"
            :class="{
                'assay-item': true,
                'assay-item--selected': !selectable && activeAssay && activeAssay.assay.getId() === assay.getId(),
                'assay-item--error': !isValidAssayName || errorStatus,
                'd-flex': true
            }">

            <!-- Icon at the start of the assay item -->
            <div class="mr-2">
                <!-- Show an error if the name of the assay is incorrect. -->
                <v-tooltip v-if="errorStatus || nameError !== ''" position="bottom" open-delay="500">
                    <template v-slot:activator="{ on }">
                        <v-icon
                            size="20"
                            color="red"
                            v-on="on">
                            mdi-alert-outline
                        </v-icon>
                    </template>
                    <span>{{ errorMessage }}</span>
                </v-tooltip>

                <!-- Show a distinct status if the analysis of the assay has been cancelled. -->
                <v-tooltip v-else-if="cancelStatus" bottom open-delay="500">
                    <template v-slot:activator="{ on }">
                        <v-icon
                            @click="reanalyse()"
                            size="20"
                            v-on="on">
                            mdi-cancel
                        </v-icon>
                    </template>
                    <span>The analysis for this assay has been cancelled. Click here to restart the analysis.</span>
                </v-tooltip>

                <span v-else-if="!analysisReady">
                    <v-progress-circular v-if="analysisInProgress" size="20" indeterminate color="primary"></v-progress-circular>

                    <v-tooltip v-else bottom open-delay="500">
                        <template v-slot:activator="{ on }">
                            <v-icon size="18" v-on="on">
                                mdi-progress-clock
                            </v-icon>
                        </template>
                        <span>This assay is queued for processing.</span>
                    </v-tooltip>
                </span>

                <!--
                    If we get here, the assay has been analysed and we either show a checkbox (for multi select), or
                    we show the default assay icon.
                -->
                <v-tooltip v-else-if="selectable" bottom open-delay="500">
                    <template v-slot:activator="{ on }">
                        <v-checkbox
                            v-on="on"
                            v-model="selected"
                            class="mr-0 pr-0"
                            @change="clickCheckbox"
                            dense
                            hide-details
                            @click.native.stop
                            :disabled="!analysisReady">
                        </v-checkbox>
                    </template>
                    <span>
                        Add assay to comparative analysis.
                    </span>
                </v-tooltip>

                <v-icon v-else size="20">
                    mdi-text-box-outline
                </v-icon>
            </div>

            <!-- Simply display the name if editing is disabled -->
            <span
                v-if="!isEditingAssayName"
                v-on:dblclick="enableAssayEdit()"
                class="assay-name">
                {{ assay.getName() }}
            </span>

            <!-- Input field when editing the name is enabled. -->
            <input
                v-else
                v-model="assayName"
                v-on:blur="disableAssayEdit()"
                v-on:keyup.enter="disableAssayEdit()"
                :class="{ 'error-item': !isValidAssayName, 'assay-name': true }"
                type="text" />

            <v-spacer></v-spacer>

            <!-- Icon on the right side of the item -->
            <div class="ml-2">
                <!-- When the assay has been fully processed, we show the info button to open up the peptide summary -->
                <v-tooltip v-if="analysisReady" bottom open-delay="500">
                    <template v-slot:activator="{ on }">
                        <v-icon
                            @click="experimentSummaryActive = true"
                            size="20"
                            class="mr-4"
                            v-on="on">
                            mdi-information-outline
                        </v-icon>
                    </template>
                    <span>Display experiment summary.</span>
                </v-tooltip>

                <!-- Otherwise, we show a button that allows the user to stop the analysis of this assay -->
                <v-tooltip v-else bottom open-delay="500">
                    <template v-slot:activator="{ on }">
                        <v-icon
                            @click="cancelAnalysis()"
                            v-on:click.stop color="#424242"
                            size="20"
                            class="mr-4"
                            v-on="on">
                            mdi-stop-circle-outline
                        </v-icon>
                    </template>
                    <span>Cancel analysis for this assay.</span>
                </v-tooltip>
            </div>
        </div>

        <experiment-summary-dialog
            :peptide-trust="peptideTrust"
            :active.sync="experimentSummaryActive">
        </experiment-summary-dialog>

        <!-- Dialog for assay deletion confirmation -->
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
    AssayAnalysisStatus,
    SearchConfiguration,
    Assay
} from "unipept-web-components";
import { v4 as uuidv4 } from "uuid";

import ExperimentSummaryDialog from "./../analysis/ExperimentSummaryDialog.vue";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import { promises as fs } from "fs";
import AnalysisSourceManager from "@/logic/filesystem/analysis/AnalysisSourceManager";

const { Menu, MenuItem } = require("@electron/remote");

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

    private experimentSummaryActive = false;
    private removeConfirmationActive = false;
    private isEditingAssayName = false;
    private isValidAssayName = true;

    // Is this assay currently selected for a comparative analysis?
    private selected = false;

    private assayName = "";

    private nameError = "";

    mounted() {
        this.onAssayChanged();
        this.onValueChanged();
    }

    get activeAssay(): AssayAnalysisStatus {
        return this.$store.getters.activeAssay;
    }

    get analysisReady(): boolean {
        return this.$store.getters.assayData(this.assay)?.analysisReady || false;
    }

    get analysisInProgress(): boolean {
        return this.$store.getters.assayData(this.assay)?.analysisInProgress || false;
    }

    get errorStatus(): boolean {
        const assayData: AssayAnalysisStatus = this.$store.getters.assayData(this.assay);
        return assayData?.error.status;
    }

    get errorMessage(): boolean {
        return this.$store.getters.assayData(this.assay)?.error.message || this.nameError;
    }

    get cancelStatus(): boolean {
        return false;
        // const assayData: AssayData = this.$store.getters.assayData(this.assay);
        // return assayData?.analysisMetaData.status === "cancelled";
    }

    get peptideTrust(): PeptideTrust {
        return this.$store.getters.assayData(this.assay)?.originalData?.trust || null;
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
    @Watch("selectable")
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

    private reanalyse() {
        this.$store.dispatch("analyseAssay", this.assay);
    }

    private selectAssay() {
        if (this.selectable) {
            this.clickCheckbox();
        } else {
            this.$store.dispatch("activateAssay", this.assay);
        }
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

        const analysisSourceMng = new AnalysisSourceManager(
            this.$store.getters.dbManager,
            this.$store.getters.projectLocation,
            this.$store
        );
        newAssay.setAnalysisSource(
            await analysisSourceMng.copyAnalysisSource(
                this.assay.getAnalysisSource(),
                newAssay
            )
        );

        newAssay.setPeptides(this.assay.getPeptides());

        const dataWriter = new AssayFileSystemDataWriter(
            `${this.$store.getters.projectLocation}${this.study.getName()}`,
            this.$store.getters.dbManager,
            this.study,
            this.$store.getters.projectLocation,
            this.$store
        );
        await newAssay.accept(dataWriter);

        await fs.copyFile(
            `${this.$store.getters.projectLocation}${this.study.getName()}/${this.assay.getName()}.pep`,
            `${this.$store.getters.projectLocation}${this.study.getName()}/${assayName}.pep`,
        );

        this.$store.dispatch("addAssay", newAssay);
        this.study.addAssay(newAssay);
        this.$store.dispatch("analyseAssay", newAssay);
    }

    private async removeAssay() {
        this.removeConfirmationActive = false;
        const assayDestroyer = new AssayFileSystemDestroyer(
            `${this.$store.getters.projectLocation}${this.study.getName()}`,
            this.$store.getters.dbManager,
            this.$store
        );
        await this.assay.accept(assayDestroyer);
        // Also remove the assay from the store
        this.study.removeAssay(this.assay);
        this.$store.dispatch("removeAssay", this.assay);
    }
}
</script>

<style lang="less">
    @import "./../../assets/style/navigation-drawers/assay-item.css.less";

    .assay-item .v-input--selection-controls__input {
        margin-right: 0 !important;
        max-width: 40px;
    }

    .assay-icon {
        position: relative;
        bottom: 1px;
    }


</style>
