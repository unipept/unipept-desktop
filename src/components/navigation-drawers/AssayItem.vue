<template>
    <div>
        <div
            @click="selectAssay()"
            @contextmenu="showContextMenu()"
            :class="{
                'assay-item': true,
                'assay-item--selected': activeAssay && activeAssay.getId() === assay.getId(),
                'assay-item--error': !isValidAssayName
            }">
            <v-progress-circular
                v-if="assay.progress !== 1"
                :rotate="-90" :size="16"
                :value="assay.progress * 100"
                color="primary">
            </v-progress-circular>
            <v-icon
                color="#424242"
                size="20"
                v-if="assay.progress === 1 && isValidAssayName">
                mdi-file-document-box-outline
            </v-icon>
            <tooltip
                v-if="!isValidAssayName"
                message="Invalid assay name. Name must be unique and non-empty."
                position="bottom">
                <v-icon
                        @click="() => {}"
                        size="20"
                        color="red">
                    mdi-alert-outline
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
            <div style="display: flex; flex-direction: row; margin-left: auto;">
                <tooltip message="Display experiment summary." position="bottom">
                    <v-icon
                        :disabled="assay.progress !== 1"
                        @click="experimentSummaryActive = true"
                        v-on:click.stop color="#424242"
                        size="20">
                        mdi-information-outline
                    </v-icon>
                </tooltip>
            </div>
        </div>
        <experiment-summary-dialog
            :assay="assay"
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
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
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
    private assay: Assay;
    @Prop({ required: true })
    private activeAssay: Assay;

    private experimentSummaryActive: boolean = false;
    private removeConfirmationActive: boolean = false;
    private isEditingAssayName: boolean = false;
    private isValidAssayName: boolean = true;

    private assayName: string = "";

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
        if (this.assayName !== "") {
            this.isValidAssayName = true;
            return true;
        } else {
            this.isValidAssayName = false;
            return false;
        }
    }

    @Watch("assay")
    private onAssayChanged() {
        this.assayName = this.assay.getName();
    }

    private selectAssay() {
        this.$emit("select-assay", this.assay);
    }

    private removeAssay() {
        this.$emit("remove-assay", this.assay);
    }
}
</script>

<style scoped>
    .assay-item {
        display: flex;
        align-items: center;
        color: #424242;
        font-weight: 700;
        cursor: pointer;
        padding-left: 24px;
    }

    .assay-item:hover {
        background-color: #F6F6F6;
    }

    .assay-item > span, input {
        margin-left: 8px;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .assay-item--selected {
        color: rgb(24, 103, 192);
        background-color: #E5EDF8;
    }

    .assay-item--selected:hover {
        background-color: #E5EDF8;
    }

    .assay-item--selected .v-icon {
        color: rgb(24, 103, 192) !important;
    }

    .assay-item--error {
        color: #F44336;
    }

    .assay-item--error.assay-item--selected {
        background-color: #FFEBEE;
    }

    .assay-item--error .v-icon {
        color: #F44336 !important;
    }
</style>