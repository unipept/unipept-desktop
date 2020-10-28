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
                        <v-checkbox dense :value="allSelected" @change="updateSelection" :disabled="isProcessing">
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
                return this.study.getAssays().some(
                    (a: Assay) => this.$store.getters["assayData"](a).analysisMetaData.progress !== 1
                );
            }
        }
    }
})
export default class SelectableStudyItem extends Vue {
    @Prop({ required: true })
    private study: Study;

    private collapsed: boolean = false;

    get selectedAssays(): Assay[] {
        return this.$store.getters["getSelectedAssays"];
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

    get allSelected(): boolean {
        const selectedAssays: Assay[] = this.$store.getters["getSelectedAssays"];
        return this.study.getAssays().every(
            a => selectedAssays.find(selected => selected.getId() === a.getId())
        );
    }

    private updateSelection(): void {
        if (this.allSelected) {
            for (const assay of this.study.getAssays()) {
                this.$store.dispatch("removeSelectedAssay", assay);
            }
            this.itemsSelected = false;
        } else {
            for (const assay of this.study.getAssays()) {
                this.$store.dispatch("addSelectedAssay", assay);
            }
            this.itemsSelected = true;
        }
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
