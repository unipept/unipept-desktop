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
            <div style="display: flex; flex-direction: row; margin-left: auto; height: 32px;" v-if="selectable">
                <tooltip message="Add assay to comparative analysis." position="bottom">
                    <v-checkbox v-model="selected" dense @click.native.stop :disabled="progress !== 1"></v-checkbox>
                </tooltip>
            </div>
            <div style="display: flex; flex-direction: row; margin-left: auto; margin-right: 8px;" v-else>
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
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import Project from "@/logic/filesystem/project/Project";
import AssayFileSystemDestroyer from "@/logic/filesystem/assay/AssayFileSystemDestroyer";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";


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
                return this.project.getProcessingResults(this.assay).errorStatus !== undefined;
            }
        }
    }
})
export default class AssayItem extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    /**
     * What assay is currently selected by the user? If this is not set, this assay will never be highlighted in the
     * sidebar.
     */
    @Prop({ required: false, default: null })
    private activeAssay: ProteomicsAssay;
    @Prop({ required: true })
    private study: Study;
    @Prop({ required: true })
    private project: Project;
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

    @Watch("selected")
    private onSelectedChanged() {
        this.$emit("input", this.selected);
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
        if (this.selectable) {
            this.selected = !this.selected;
        } else {
            this.$emit("select-assay", this.assay);
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
            let newName;
            while (otherAssayWithName) {
                newName = `${assayName} (${counter})`;
                otherAssayWithName = this.study.getAssays().find(a => a.getName() === newName);
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
            `${this.project.projectPath}${this.study.getName()}`,
            this.project.db,
            this.study
        );
        await newAssay.accept(metadataWriter);

        await fs.copyFile(
            `${this.project.projectPath}${this.study.getName()}/${this.assay.getName()}.pep`,
            `${this.project.projectPath}${this.study.getName()}/${assayName}.pep`,
        );
    }

    private async removeAssay() {
        this.removeConfirmationActive = false;
        const assayDestroyer = new AssayFileSystemDestroyer(
            `${this.project.projectPath}${this.study.getName()}`,
            this.project.db
        );
        await this.assay.accept(assayDestroyer);
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/assay-item.css.less";
</style>
