<template>
    <div class="d-flex flex-column" style="min-height: 100%;">
        <div
            class="sample-list-placeholder"
            v-if="$store.getters.studies.length === 0">
            No studies present.
        </div>
        <div v-else class="flex-grow-1">
            <div
                v-for="study of $store.getters.studies"
                :key="study.getId()">
                <study-item :study="study"></study-item>
            </div>
        </div>
        <div class="text-center mt-4 mb-4">
            <v-btn class="select-sample-button" depressed color="primary" @click="createStudy()">
                Create study
            </v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Tooltip, Study } from "unipept-web-components";
import StudyItem from "./StudyItem.vue";
import mkdirp from "mkdirp";

@Component({
    components: {
        Tooltip,
        StudyItem
    },
    computed: {
        sortedStudies: {
            get(): Study[] {
                return this.$store.getters.studies.sort(
                    (a: Study, b: Study) => a.getName().localeCompare(b.getName())
                )
            }
        }
    }
})
export default class SingleAnalysisToolbar extends Vue {
    private createStudy() {
        // Check which studies already exist, and make sure there isn't one with the same name.
        const unknowns: number[] = this.$store.getters.studies
            .map((s: Study) => s.getName())
            .filter((s: string) => s.startsWith("Unknown"))
            .map((s: string) => s.replace(/[^0-9]/g, ""))
            .map((s: string) => s === "" ? 0 : parseInt(s));

        let studyName: string = "Unknown";
        if (unknowns.length > 0) {
            studyName += ` (${Math.max(...unknowns) + 1})`
        }

        // Write a new directory to the file system with this name, the file system watcher will then automatically
        // pick this up.
        mkdirp(`${this.$store.getters.projectLocation}${studyName}`);
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

    .select-sample-button {

        /*margin: 0 auto;*/
        /*display: block !important;*/
        /*position: sticky !important;*/
        /*bottom: 72px;*/
        /*left: 50%;*/
        /*transform: translateX(-50%);*/
    }
</style>
