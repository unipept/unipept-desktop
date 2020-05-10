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
                <v-menu>
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
                v-on:select-assay="onSelectAssay"
                v-on:remove-assay="onRemoveAssay">
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

    private removeStudy() {
        this.project.removeStudy(this.study);
    }

    private async createFromFile() {
        const chosenPath: string | undefined = await dialog.showOpenDialog({
            properties: ["openFile"]
        });

        if (chosenPath && chosenPath["filePaths"] && chosenPath["filePaths"].length > 0) {
            const assayName = path.basename(chosenPath["filePaths"][0]).replace(/\.[^/.]+$/, "");
            await fs.copyFile(chosenPath["filePaths"][0], this.project.projectPath + this.study.getName() + "/" + assayName + ".pep");
        }
    }

    private async onCreateAssay(assay: Assay) {
        this.showCreateAssayDialog = false;
    }

    private async onSelectAssay(assay: Assay) {
        this.project.activateAssay(assay);
    }

    private async onRemoveAssay(assay: Assay) {
        await this.study.removeAssay(assay);
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
