<template>
    <div>
        <div
            @click="selectAssay(assay)"
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
                <tooltip message="Remove assay from analysis." position="bottom">
                    <v-icon
                        :disabled="assay.progress !== 1"
                        @click="removeAssay(assay)"
                        v-on:click.stop color="#424242"
                        size="20">
                        mdi-close
                    </v-icon>
                </tooltip>
            </div>
        </div>
        <experiment-summary-dialog
            :assay="assay"
            :active.sync="experimentSummaryActive">
        </experiment-summary-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {Prop, Watch} from "vue-property-decorator";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import ExperimentSummaryDialog from "./../analysis/ExperimentSummaryDialog.vue";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";

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

    private selectAssay(assay: Assay) {
        this.$emit("select-assay", assay);
    }

    private removeAssay(assay: Assay) {
        this.$emit("remove-assay", assay);
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
        padding-left: 16px;
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