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
                <v-menu v-if="assaysInProgress.length === 0">
                    <template v-slot:activator="{ on: menu }">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on: tooltip }">
                                <v-icon
                                    color="#424242"
                                    size="20"
                                    v-on="{ ...tooltip, ...menu }">
                                    mdi-file-plus-outline
                                </v-icon>
                            </template>
                            <span>Create a new assay</span>
                        </v-tooltip>
                    </template>
                    <v-list>
                        <v-list-item @click="showCreateAssayDialog = true">
                            <v-list-item-title>From peptides</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="createFromFile()">
                            <v-list-item-title>From file</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
                <v-progress-circular v-else indeterminate :size="16" color="primary"></v-progress-circular>
            </div>
        </div>
        <div class="assay-items" v-if="study.getAssays().length > 0 && !collapsed">
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
        <v-dialog v-model="showCreateAssayDialog" max-width="800" v-if="study">
            <v-card>
                <v-card-title>
                    Create assay
                </v-card-title>
                <v-card-text>
                    <create-assay :study="study" v-on:create-assay="onCreateAssay"></create-assay>
                </v-card-text>
            </v-card>
        </v-dialog>
        <search-configuration-dialog
                v-model="showSearchConfigDialog"
                :assay="searchConfigAssay"
                :callback="searchConfigCallback">
        </search-configuration-dialog>
        <confirm-deletion-dialog
            v-model="removeConfirmationActive"
            :action="() => removeStudy()"
            item-type="study">
        </confirm-deletion-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { CreateDatasetCard, Tooltip, Assay, Study, ProteomicsAssay } from "unipept-web-components";
import CreateAssay from "./../assay/CreateAssay.vue";
import AssayItem from "./AssayItem.vue";
import ConfirmDeletionDialog from "@/components/dialogs/ConfirmDeletionDialog.vue";
import StudyFileSystemRemover from "@/logic/filesystem/study/StudyFileSystemRemover";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import SearchConfigurationDialog from "@/components/dialogs/SearchConfigurationDialog.vue";
import { v4 as uuidv4 } from "uuid";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import path from "path";


const { remote } = require("electron");
const { Menu, MenuItem } = remote;
const fs = require("fs").promises;

const electron = require("electron");
const { dialog } = electron.remote;

@Component({
    components: {
        SearchConfigurationDialog,
        ConfirmDeletionDialog,
        CreateDatasetCard,
        CreateAssay,
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
                    (a: Assay) => this.$store.getters["assayData"](a).analysisMetaData.progress !== 1
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
    private removeConfirmationActive: boolean = false;
    private showSearchConfigDialog: boolean = false;
    private searchConfigCallback: () => Promise<void> = async() => {
        return;
    };
    private searchConfigAssay: ProteomicsAssay = null;

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

    private disableStudyEdit() {
        if (this.checkStudyNameValidity()) {
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

    private async createFromFile() {
        const chosenPath: Electron.OpenDialogReturnValue | undefined = await dialog.showOpenDialog({
            properties: ["openFile"],
            defaultPath: this.previousDirectory
        });

        if (chosenPath && chosenPath["filePaths"] && chosenPath["filePaths"].length > 0) {
            let assayName = path.basename(chosenPath["filePaths"][0]).replace(/\.[^/.]+$/, "");
            assayName = this.generateUniqueAssayName(assayName);

            this.previousDirectory = path.dirname(chosenPath["filePaths"][0]);

            this.assaysInProgress.push(assayName);

            // First ask the user for the desired search configuration that should be applied for this assay and write
            // it to the db.
            const assay = new ProteomicsAssay(uuidv4());
            assay.setName(assayName);
            this.requestSearchSettings(assay, async() => {
                // Write metadata to disk
                const metaDataWriter = new AssayFileSystemMetaDataWriter(
                    `${this.$store.getters.projectLocation}${this.study.getName()}`,
                    this.$store.getters.dbManager,
                    this.study
                );

                await assay.accept(metaDataWriter);

                await fs.copyFile(
                    chosenPath["filePaths"][0],
                    this.$store.getters.projectLocation + this.study.getName() + "/" + assayName + ".pep"
                )
            });
        }
    }

    private onCreateAssay(assay: ProteomicsAssay) {
        this.showCreateAssayDialog = false;

        // First ask the user for the desired search configuration that should be applied for this assay and write it to
        // the db.
        this.requestSearchSettings(assay, async() => {
            let assayName = assay.getName();
            if (assayName === "") {
                assayName = "Unknown";
            }

            assayName = this.generateUniqueAssayName(assayName);
            assay.setName(assayName);

            // Write metadata to disk
            const metaDataWriter = new AssayFileSystemMetaDataWriter(
                `${this.$store.getters.projectLocation}${this.study.getName()}`,
                this.$store.getters.dbManager,
                this.study
            );

            await assay.accept(metaDataWriter);

            // Write the assay to disk. It will automatically be picked up by the file system watchers
            const assaySerializer = new AssayFileSystemDataWriter(
                `${this.$store.getters.projectLocation}${this.study.getName()}`,
                this.$store.getters.dbManager
            );

            await assay.accept(assaySerializer);
        })
    }

    private requestSearchSettings(assay: ProteomicsAssay, callback: () => Promise<void>) {
        this.searchConfigAssay = assay;
        this.searchConfigCallback = callback;
        this.showSearchConfigDialog = true;
    }

    private async onSelectAssay(assay: Assay) {
        await this.$store.dispatch("activateAssay", assay);
    }

    /**
     * Check to see if an assay with the requested name already exists for this study. If this is the case, a counter
     * will be added to the requestedName making it unique. The counter will be incremented until the name is completely
     * unique.
     *
     * @param requestedName Assay name that we are trying to make unique by adding a counter.
     */
    private generateUniqueAssayName(requestedName: string): string {
        // Check if assay with same name already exists in the list of assays for this study. If so, change the name
        // to make it unique.
        let otherAssayWithName = this.study.getAssays().find(a => a.getName() === requestedName);
        if (otherAssayWithName) {
            // Append a number to the assay to make it unique. An assay with this name might again already exist, which
            // is why we need to check for uniqueness in a loop.
            let counter = 1;
            let newName: string;
            while (otherAssayWithName) {
                newName = `${requestedName} (${counter})`;
                otherAssayWithName = this.study.getAssays().find((a: ProteomicsAssay) => a.getName() === newName);
                counter++;
            }
            requestedName = newName;
        }
        return requestedName;
    }
}
</script>

<style lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
