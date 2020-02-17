<template>
    <div>
        <div 
            class="sample-list-placeholder" 
            v-if="!project || project.getStudies().length === 0">
            No studies present.
        </div>
        <div v-else v-for="study of project.getStudies()" :key="study.getId()">
            <study-item :study="study"></study-item>
        </div>
        <v-btn class="select-sample-button" depressed color="primary" @click="createStudy()">
            Create study
        </v-btn>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Project from "@/logic/project/Project";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import LoadDatasetsCard from "../dataset/LoadDatasetsCard.vue";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import StudyItem from "./StudyItem.vue";

@Component({
    components: {
        LoadDatasetsCard,
        Tooltip,
        StudyItem
    }
})
export default class ToolbarExplorer extends Vue {
    @Prop({ required: true })
    private project: Project;

    private createStudy() {
        if (this.project !== null) {
            const study: Study = this.project.createStudy();
        }
    }
}
</script>

<style>
    .sample-list-placeholder {
        margin-left: 8px; 
        margin-right: 8px;
        position: relative;
        top: 16px;
        text-align: center;
    }
</style>
