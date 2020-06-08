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
            <span class="study-item-name">
                {{ study.getName() }}
            </span>
            <div class="study-action" style="margin-right: 0;">
                <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                        <v-checkbox dense :disabled="isProcessing"></v-checkbox>
                    </template>
                    <span>Toggle selection of all assays in this study.</span>
                </v-tooltip>
            </div>
        </div>
        <div class="assay-items" v-if="study.getAssays().length > 0 && !collapsed">
            <assay-item
                v-for="assay of sortedAssays"
                :selectable="true"
                :assay="assay"
                :study="study"
                :project="project"
                v-bind:key="assay.id"
                :value="assayInComparison(assay)"
                v-on:input="toggleAssayComparison(assay)">
            </assay-item>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Study from "unipept-web-components/src/business/entities/study/Study";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import Project from "@/logic/filesystem/project/Project";
import AssayItem from "@/components/navigation-drawers/AssayItem.vue";

@Component({
    components: {
        AssayItem
    },
    computed: {
        sortedAssays: {
            get(): Assay[] {
                return this.study.getAssays().sort(
                    (a: Assay, b: Assay) => a.getName().localeCompare(b.getName())
                )
            }
        },
        isProcessing: {
            get(): boolean {
                return this.study.getAssays().some(a => this.project.getProcessingResults(a).progress !== 1);
            }
        }
    }
})
export default class SelectableStudyItem extends Vue {
    @Prop({ required: true })
    private study: Study;
    @Prop({ required: true })
    private assaysInComparison: Assay[];
    @Prop({ required: true })
    private project: Project;

    private collapsed: boolean = false;

    private inComparison: Assay[] = [];

    private mounted() {
        this.onAssaysInComparisonChanged();
    }

    @Watch("assaysInComparison")
    private onAssaysInComparisonChanged() {
        this.inComparison = [...this.assaysInComparison];
    }

    private toggleAssayComparison(assay: Assay) {
        const idx: number = this.assaysInComparison.findIndex(a => a.getId() === assay.getId());

        if (idx === -1) {
            this.$emit("select-assay", assay);
        } else {
            this.$emit("deselect-assay", assay);
        }
    }

    private assayInComparison(assay: Assay): boolean {
        return this.assaysInComparison.findIndex(a => a.getId() === assay.getId()) !== -1;
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
