<template>
    <div>
        <div
            class="sample-list-placeholder"
            v-if="!project || project.getStudies().length === 0">
            No studies present.
        </div>
        <div
            v-else
            v-for="study of project.getStudies()"
            :key="study.getId()">
            <study-item :study="study" :project="project"></study-item>
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
import Project from "@/logic/filesystem/project/Project";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import StudyItem from "./StudyItem.vue";
import Study from "unipept-web-components/src/business/entities/study/Study";

@Component({
    components: {
        Tooltip,
        StudyItem
    },
    computed: {
        sortedStudies: {
            get(): Study[] {
                return this.project.getStudies().sort(
                    (a: Study, b: Study) => a.getName().localeCompare(b.getName())
                )
            }
        }
    }
})
export default class ToolbarExplorer extends Vue {
    @Prop({ required: true })
    private project: Project;

    private createStudy() {
        if (this.project !== null) {
            // Check which studies already exist, and make sure there isn't one with the same name.
            const unknowns = this.project.getStudies()
                .map(s => s.getName())
                .filter(s => s.startsWith("Unknown"))
                .map(s => s.replace(/[^0-9]/g, ""))
                .map(s => s === "" ? 0 : parseInt(s))

            let studyName: string = "Unknown";
            if (unknowns.length > 0) {
                studyName += ` (${Math.max(...unknowns) + 1})`
            }
            this.project.createStudy(studyName);
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
