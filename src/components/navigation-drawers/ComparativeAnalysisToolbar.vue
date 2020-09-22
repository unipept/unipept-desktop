<template>
    <div>
        <div
            class="sample-list-placeholder"
            v-if="$store.getters.studies.length === 0">
            No studies present.
        </div>
        <div
            v-else
            v-for="study of $store.getters.studies"
            :key="study.getId()">
            <selectable-study-item
                :study="study"
                :assays-in-comparison="$store.getters.getSelectedAssays"
                v-on:select-assay="selectAssay"
                v-on:deselect-assay="deselectAssay">
            </selectable-study-item>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { Study, Tooltip, Assay } from "unipept-web-components";
import SelectableStudyItem from "@/components/navigation-drawers/SelectableStudyItem.vue";

@Component({
    components: {
        Tooltip,
        SelectableStudyItem
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
export default class ComparativeAnalysisToolbar extends Vue {
    private selectAssay(assay: Assay) {
        this.$store.dispatch("addSelectedAssay", assay);
    }

    private deselectAssay(assay: Assay) {
        this.$store.dispatch("removeSelectedAssay", assay);
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
