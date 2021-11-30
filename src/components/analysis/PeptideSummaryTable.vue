<template>
    <v-data-table
        class="peptide-summary-table"
        :headers="headers"
        :items="items"
        :items-per-page="5"
        :server-items-length="totalItems"
        :options.sync="options"
        :loading="loading || computeProgress !== 1"
        :loading-text="'Loading items: ' + Math.round(computeProgress * 100) + '%'">
        <template v-slot:progress>
            <v-progress-linear :value="computeProgress * 100" height="2"></v-progress-linear>
        </template>
        <template v-slot:item.peptide="{ item }">
            <div class="sequence-value" :title="item.peptide">
                <a @click="openPeptide(item.peptide)">
                    {{ item.peptide }}
                </a>
            </div>
        </template>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { ProteomicsAssay, CountTable, Peptide } from "unipept-web-components";
import { DataOptions } from "vuetify";
import { ItemType } from "@/state/PeptideSummaryTable.worker";

@Component({
    computed: {
        progress: {
            get(): number {
                // const assayData: AssayData = this.$store.getters.assayData(this.assay);
                // return assayData ? assayData.analysisMetaData.progress : 0;

                return 0;
            }
        },
        headers: {
            get() {
                return [
                    {
                        text: "Peptide",
                        align: "start",
                        value: "peptide",
                        width: "25%"
                    },
                    {
                        text: "Occurrence",
                        align: "start",
                        value: "count",
                        width: "20%"
                    }, {
                        text: "Lowest common ancestor",
                        align: "start",
                        value: "lca",
                        width: "35%"
                    }, {
                        text: "Rank",
                        align: "start",
                        value: "rank",
                        width: "20%"
                    }
                ];
            }
        }
    }
})
export default class PeptideSummaryTable extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;

    private items: ItemType[] = [];
    private options = {};

    private loading: boolean = false;

    get computeProgress(): number {
        return this.$store.getters["peptideSummary/getProgress"](this.assay);
    }

    get totalItems(): number {
        return this.peptideCountTable?.totalCount;
    }

    get peptideCountTable(): CountTable<Peptide> {
        return this.$store.getters.assayData(this.assay)?.peptideCountTable;
    }

    @Watch("options", { deep: true })
    private async onOptionsChanged(newOptions: DataOptions) {
        this.loading = true;
        if (this.computeProgress === 1) {
            this.items = await this.$store.getters["peptideSummary/getSummaryItems"](this.assay, newOptions);
        }
        this.loading = false;
    }

    @Watch("assay")
    @Watch("peptideCountTable", { immediate: true })
    @Watch("computeProgress")
    private async onProgressChanged() {
        if (this.computeProgress === 1) {
            await this.onOptionsChanged({
                page: 1,
                itemsPerPage: 5,
                sortBy: [],
                sortDesc: [],
                multiSort: false,
                mustSort: false,
                groupBy: [],
                groupDesc: []
            });
        }

        if (this.computeProgress === 0) {
            this.items.splice(0, this.items.length);
        }
    }

    private openPeptide(peptide: Peptide): void {
        this.$store.dispatch("peptideSummary/setPeptide", [peptide, this.assay.getSearchConfiguration().equateIl]);
        this.$router.push("/peptide/single");
    }
}
</script>

<style scoped>
    .sequence-value {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
