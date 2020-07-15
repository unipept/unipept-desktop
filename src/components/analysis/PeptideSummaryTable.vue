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
            <div class="sequence-value" :title="item.peptide">{{ item.peptide }}</div>
        </template>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { DataOptions } from "vuetify";
import { AssayData } from "unipept-web-components/src/state/AssayStore";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";

@Component({
    computed: {
        progress: {
            get(): number {
                const assayData: AssayData = this.$store.getters.assayData(this.assay);
                return assayData ? assayData.analysisMetaData.progress : 0;
            }
        },
        headers: {
            get() {
                return [
                    {
                        text: "Peptide",
                        align: "start",
                        value: "peptide",
                        width: "30%"
                    },
                    {
                        text: "Occurrence",
                        align: "start",
                        value: "count",
                        width: "15%"
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

    private items = [];
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

    @Watch("computeProgress")
    private async onProgressChanged(progress: number) {
        if (progress === 1) {
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

        if (progress === 0) {
            this.items.splice(0, this.items.length);
        }
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
