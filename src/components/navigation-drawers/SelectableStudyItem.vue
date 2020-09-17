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
                        <v-checkbox dense :value="itemsSelected" @change="updateSelection" :disabled="isProcessing">
                        </v-checkbox>
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
import { Study, Assay } from "unipept-web-components";
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
                return this.study.getAssays().some((a: Assay) => this.$store.getters["assayData"](a).analysisMetaData.progress !== 1);
            }
        }
    }
})
export default class SelectableStudyItem extends Vue {
    @Prop({ required: true })
    private study: Study;
    @Prop({ required: true })
    private assaysInComparison: Assay[];

    private collapsed: boolean = false;

    private inComparison: Assay[] = [];
    private itemsSelected: boolean = false;
    // Ids of the assays that should not be toggled this time
    private doNotToggle: string[] = [];

    private mounted() {
        this.onAssaysInComparisonChanged();
    }

    get selectedAssays(): Assay[] {
        return this.$store.getters["getSelectedAssays"];
    }

    @Watch("selectedAssays")
    private onSelectedItemsChanged() {
        this.itemsSelected = this.study.getAssays().every(
            a => this.selectedAssays.find(selected => selected.getId() === a.getId())
        );
    }

    @Watch("assaysInComparison")
    private onAssaysInComparisonChanged() {
        this.inComparison = [...this.assaysInComparison];
    }

    private toggleAssayComparison(assay: Assay) {
        // Avoid an infinite loop
        const dontToggleIdx = this.doNotToggle.indexOf(assay.getId())
        if (dontToggleIdx >= 0) {
            this.doNotToggle.splice(dontToggleIdx, 1);
            return;
        }

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

    private updateSelection(): void {
        const selectedAssays: Assay[] = this.$store.getters["getSelectedAssays"];
        const allSelected = this.study.getAssays().every(
            a => selectedAssays.find(selected => selected.getId() === a.getId())
        );

        if (allSelected) {
            for (const assay of this.study.getAssays()) {
                this.$store.dispatch("removeSelectedAssay", assay);
                this.doNotToggle.push(assay.getId());
            }
        } else {
            for (const assay of this.study.getAssays()) {
                this.$store.dispatch("addSelectedAssay", assay);
                this.doNotToggle.push(assay.getId());
            }
        }
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
