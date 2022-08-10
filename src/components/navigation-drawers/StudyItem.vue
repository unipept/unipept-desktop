<template>
    <div>
        <div class="study-item" @contextmenu="showContextMenu()">
            <v-icon
                v-if="!collapsed"
                color="#424242"
                style="padding-left: 8px;"
                @click="collapsed = !collapsed">
                mdi-chevron-down
            </v-icon>
            <v-icon
                v-else
                color="#424242"
                style="padding-left: 8px;"
                @click="collapsed = !collapsed">
                mdi-chevron-right
            </v-icon>
            <v-tooltip v-if="selectable" bottom>
                <template v-slot:activator="{ on }">
                    <v-checkbox
                        dense
                        hide-details
                        class="mt-0 pt-0"
                        :input-value="allSelected"
                        :value="allSelected"
                        @change="updateSelection"
                        :disabled="isProcessing">
                    </v-checkbox>
                </template>
                <span>Toggle selection of all assays in this study.</span>
            </v-tooltip>
            <span
                v-if="!isEditingStudyName"
                v-on:dblclick="enableStudyEdit()"
                class="study-item-name">
                {{ studyName }}
            </span>
            <input
                v-if="isEditingStudyName"
                v-on:blur="disableStudyEdit()"
                v-on:keyup.enter="disableStudyEdit()"
                :class="{ 'study-item-name': true, 'error-item': !isValidStudyName }"
                type="text"
                v-model="studyName" />
            <div class="study-action">
                <v-tooltip bottom v-if="!isValidStudyName">
                    <template v-slot:activator="{ on }">
                        <v-icon
                            v-on="on"
                            size="20"
                            color="red">
                            mdi-alert-outline
                        </v-icon>
                    </template>
                    <span>{{ nameError }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                    <template v-slot:activator="{ on: tooltip }">
                        <v-btn text icon @click="createAssay">
                            <v-icon color="#424242" size="20" v-on="{ ...tooltip }">
                                mdi-file-plus-outline
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>Create a new assay</span>
                </v-tooltip>
            </div>
        </div>
        <div class="assay-items" v-if="!collapsed">
            <div v-if="study.getAssays().length > 0">
                <assay-item
                    v-for="assay of sortedAssays"
                    :selectable="selectable"
                    :assay="assay"
                    :study="study"
                    v-bind:key="assay.id"
                    :value="assayInComparison(assay)"
                    v-on:input="toggleAssayComparison(assay)"
                    v-on:select-assay="onSelectAssay">
                </assay-item>
            </div>
            <div v-else>
                <!-- placeholder button to add a new assay -->
                <div class="assay-item" @click="createAssay()">
                    <v-icon size="20" color="primary">
                        mdi-file-plus-outline
                    </v-icon>
                    <a class="assay-name">
                        Add new assay
                    </a>
                </div>
            </div>
        </div>
        <search-configuration-dialog
            v-model="showSearchConfigDialog"
            :assays="searchConfigAssays"
            :callback="searchConfigCallback">
        </search-configuration-dialog>
        <confirm-deletion-dialog
            v-model="removeConfirmationActive"
            :action="() => removeStudy()"
            item-type="study">
        </confirm-deletion-dialog>
        <binary-files-error-dialog
            v-model="showBinaryFilesError"
            :binary-files="binaryFilesList">
        </binary-files-error-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import {
    CreateDatasetCard,
    Tooltip,
    Assay,
    Study,
    ProteomicsAssay,
    NetworkConfiguration
} from "unipept-web-components";
import AssayItem from "./AssayItem.vue";
import ConfirmDeletionDialog from "@/components/dialogs/ConfirmDeletionDialog.vue";
import StudyFileSystemRemover from "@/logic/filesystem/study/StudyFileSystemRemover";
import SearchConfigurationDialog from "@/components/dialogs/SearchConfigurationDialog.vue";
import BinaryFilesErrorDialog from "@/components/dialogs/BinaryFilesErrorDialog.vue";
import StudyManager from "@/logic/filesystem/study/StudyManager";


const { remote } = require("electron");
const { Menu, MenuItem } = remote;
const fs = require("fs").promises;

const electron = require("electron");
const { dialog } = electron.remote;

@Component({
    components: {
        BinaryFilesErrorDialog,
        SearchConfigurationDialog,
        ConfirmDeletionDialog,
        CreateDatasetCard,
        Tooltip,
        AssayItem
    },
    computed: {
        sortedAssays: {
            get(): Assay[] {
                return this.study.getAssays().sort(
                    (a: Assay, b: Assay) => a.getName().localeCompare(b.getName())
                );
            }
        },
        isProcessing: {
            get(): boolean {
                return this.study.getAssays().some(
                    (a: Assay) => this.$store.getters.assayData(a).analysisInProgress
                );
            }
        }
    }
})
export default class StudyItem extends Vue {
    @Prop({ required: true })
    private study: Study;
    @Prop({ required: false, default: false })
    private selectable: boolean;

    private collapsed: boolean = false;
    private studyName: string = "";
    private showCreateAssayDialog: boolean = false;

    private showBinaryFilesError: boolean = false;
    private binaryFilesList: string[] = [];

    private removeConfirmationActive: boolean = false;
    private showSearchConfigDialog: boolean = false;
    private searchConfigCallback: (cancelled: boolean) => Promise<void> = async(cancelled: boolean) => {
        return;
    };
    private searchConfigAssays: ProteomicsAssay[] = [];

    private isEditingStudyName: boolean = false;
    private isValidStudyName: boolean = true;

    private nameError: string = "";
    // Keep track of the names of the assays that we are currently processing.
    private assaysInProgress: string[] = [];

    // The previous directory that was used to load an assay from.
    // (Is required to open the file dialog in the same directory on Linux)
    private previousDirectory: string = undefined;

    mounted() {
        this.onStudyChanged();
    }

    get selectedAssays(): Assay[] {
        return this.$store.getters["getSelectedAssays"];
    }

    get allSelected(): boolean {
        const selectedAssays: Assay[] = this.$store.getters["getSelectedAssays"];
        return this.study.getAssays().every(
            a => selectedAssays.find(selected => selected.getId() === a.getId())
        );
    }

    @Watch("study")
    private onStudyChanged() {
        this.studyName = this.study.getName();
    }

    @Watch("study.assays")
    private onAssaysChanged() {
        const toRemove = [];
        for (const assay of this.study.getAssays()) {
            if (this.assaysInProgress.includes(assay.getName())) {
                toRemove.push(assay.getName());
            }
        }

        for (const remove of toRemove) {
            const idx = this.assaysInProgress.indexOf(remove);
            this.assaysInProgress.splice(idx, 1);
        }
    }

    private toggleAssayComparison(assay: Assay) {
        const idx = this.selectedAssays.indexOf(assay);
        if (idx !== -1) {
            // Remove from the selected assays
            this.$store.dispatch("removeSelectedAssay", assay);
        } else {
            // Add to the selected assays
            this.$store.dispatch("addSelectedAssay", assay);
        }
    }

    private assayInComparison(assay: Assay): boolean {
        return this.selectedAssays.findIndex(a => a.getId() === assay.getId()) !== -1;
    }

    private updateSelection(): void {
        if (this.allSelected) {
            for (const assay of this.study.getAssays()) {
                this.$store.dispatch("removeSelectedAssay", assay);
            }
        } else {
            for (const assay of this.study.getAssays()) {
                this.$store.dispatch("addSelectedAssay", assay);
            }
        }
    }

    private showContextMenu() {
        const menu = new Menu()
        menu.append(new MenuItem({
            label: "Rename",
            click: () => {
                this.enableStudyEdit();
            }
        }));
        menu.append(new MenuItem({ type: "separator" }));
        menu.append(new MenuItem({
            label: "Delete",
            click: () => {
                this.removeConfirmationActive = true;
            }
        }));
        menu.popup();
    }

    private enableStudyEdit() {
        this.isEditingStudyName = true;
    }

    private async disableStudyEdit() {
        if (this.checkStudyNameValidity()) {
            // First write the changes to this study to disk.
            const studyManager = new StudyManager(this.$store.getters.dbManager, this.$store.getters.projectLocation);
            await studyManager.renameStudy(this.study, this.study.getName(), this.studyName);
            this.study.setName(this.studyName);
            this.isEditingStudyName = false;
        }
    }

    @Watch("studyName")
    private onStudyNameChanged() {
        if (this.isEditingStudyName) {
            this.checkStudyNameValidity();
        }
    }

    private checkStudyNameValidity(): boolean {
        if (this.studyName === "") {
            this.nameError = "Name cannot be empty.";
            this.isValidStudyName = false;
            return false;
        }

        const nameExists: boolean = this.$store.getters.studies
            .map((s: Study) => s.getName().toLocaleLowerCase())
            .indexOf(this.studyName.toLocaleLowerCase()) !== -1;

        if ((nameExists && this.study.getName() !== this.studyName)) {
            this.nameError = "A study with this name already exists.";
            this.isValidStudyName = false;
            return false;
        }

        this.isValidStudyName = true;
        return true;
    }

    private async removeStudy(): Promise<void> {
        // Completely destroy this study and wait for the file system watcher to pick the change up.
        const studyDestroyer = new StudyFileSystemRemover(
            `${this.$store.getters.projectLocation}${this.study.getName()}`,
            this.$store.getters.dbManager
        );
        await this.study.accept(studyDestroyer);
    }

    private async onSelectAssay(assay: Assay) {
        await this.$store.dispatch("activateAssay", assay);
    }

    private createAssay() {
        // Emit event to indicate that we want to create a new assay
        this.$emit("createAssay", this.study);
    }
}
</script>

<style lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
