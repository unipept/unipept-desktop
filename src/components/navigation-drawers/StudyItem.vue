<template>
    <div>
        <div class="study-item">
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
            <div style="margin-left: auto;">
                <v-tooltip bottom v-if="!isValidStudyName">
                    <template v-slot:activator="{ on }">
                        <v-icon
                            v-on="on"
                            size="20"
                            color="red">
                            mdi-alert-outline
                        </v-icon>
                    </template>
                    <span>Invalid study name. Name must be unique and non-empty.</span>
                </v-tooltip>
                <v-icon
                    color="#424242"
                    size="20"
                    @click="showCreateAssayDialog = true">
                    mdi-file-plus-outline
                </v-icon>
            </div>
        </div>
        <div class="assay-items" v-if="study.getAssays().length > 0 && !collapsed">
            <assay-item
                v-for="assay of sortedAssays"
                :assay="assay"
                v-bind:key="assay.getId()"
                :active-assay="$store.getters.getActiveAssay"
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
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import CreateDatasetCard from "unipept-web-components/src/components/dataset/CreateDatasetCard.vue";
import CreateAssay from "./../assay/CreateAssay.vue";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import Project from "@/logic/filesystem/project/Project";
import AssayItem from "./AssayItem.vue";

@Component({
    components: {
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
    @Prop({ required: true })
    // The assay that's currently selected by the user for analysis
    private activeAssay: Assay;

    private collapsed: boolean = false;
    private studyName: string = "";
    private showCreateAssayDialog: boolean = false;

    private isEditingStudyName: boolean = false;
    private isValidStudyName: boolean = true;

    mounted() {
        this.onStudyChanged();
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
        this.checkStudyNameValidity();
    }

    private checkStudyNameValidity(): boolean {
        if (this.studyName !== "") {
            this.isValidStudyName = true;
            return true;
        } else {
            this.isValidStudyName = false;
            return false;
        }
    }

    private async onCreateAssay(assay: Assay) {
        this.showCreateAssayDialog = false;
        await this.$store.dispatch("processAssay", assay);
    }

    private async onSelectAssay(assay: Assay) {
        await this.$store.dispatch("setActiveAssay", assay);
    }

    private async onRemoveAssay(assay: Assay) {
        await this.study.removeAssay(assay);
    }
}
</script>

<style scoped>
    .study-item {
        display: flex;
        align-items: center;
        background-color: #eee;
        color: #424242;
        font-weight: 700;
    }

    .study-item-name {
        font-size: 16px;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .error-item {
        color: red;
    }
</style>
