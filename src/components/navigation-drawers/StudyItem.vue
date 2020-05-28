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
                :assay="assay"
                :study="study"
                :project="project"
                v-bind:key="assay.id"
                :active-assay="project.activeAssay"
                v-on:select-assay="onSelectAssay">
            </assay-item>
        </div>
        <v-dialog v-model="showCreateAssayDialog" max-width="800" v-if="study">
            <v-card>
                <v-card-title>
                    Create assay
                </v-card-title>
                <v-card-text>
                    <create-assay :project="project" :study="study" v-on:create-assay="onCreateAssay"></create-assay>
                </v-card-text>
            </v-card>
        </v-dialog>
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
import CreateDatasetCard from "unipept-web-components/src/components/dataset/CreateDatasetCard.vue";
import CreateAssay from "./../assay/CreateAssay.vue";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import Project from "@/logic/filesystem/project/Project";
import AssayItem from "./AssayItem.vue";
import ConfirmDeletionDialog from "@/components/dialogs/ConfirmDeletionDialog.vue";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import Study from "unipept-web-components/src/business/entities/study/Study";
const { remote } = require("electron");
const { Menu, MenuItem } = remote;
const fs = require("fs").promises;
import path from "path";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import StudyFileSystemRemover from "@/logic/filesystem/study/StudyFileSystemRemover";

const electron = require("electron");
const { dialog } = electron.remote;

@Component({
    components: {
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
                )
            }
        }
    }
})
export default class StudyItem extends Vue {
    @Prop({ required: true })
    private study: Study;
    @Prop({ required: true })
    private project: Project;

    private collapsed: boolean = false;
    private studyName: string = "";
    private showCreateAssayDialog: boolean = false;
    private removeConfirmationActive: boolean = false;

    private isEditingStudyName: boolean = false;
    private isValidStudyName: boolean = true;

    private nameError: string = "";
    private assaysInProgress = [];

    mounted() {
        this.onStudyChanged();
    }

    private showContextMenu() {
        const menu = new Menu()
        menu.append(new MenuItem({
            label: "Rename",
            click: () => {
                this.enableStudyEdit();
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

        const nameExists: boolean = this.project.getStudies()
            .map(s => s.getName().toLocaleLowerCase())
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
            `${this.project.projectPath}${this.study.getName()}`,
            this.project.db
        );
        await this.study.accept(studyDestroyer);
    }

    private async createFromFile() {
        const chosenPath: string | undefined = await dialog.showOpenDialog({
            properties: ["openFile"]
        });

        if (chosenPath && chosenPath["filePaths"] && chosenPath["filePaths"].length > 0) {
            let assayName = path.basename(chosenPath["filePaths"][0]).replace(/\.[^/.]+$/, "");

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
            this.assaysInProgress.push(assayName);

            await fs.copyFile(chosenPath["filePaths"][0], this.project.projectPath + this.study.getName() + "/" + assayName + ".pep");
        }
    }

    private async onCreateAssay(assay: Assay) {
        this.showCreateAssayDialog = false;
    }

    private async onSelectAssay(assay: Assay) {
        this.project.activateAssay(assay);
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
