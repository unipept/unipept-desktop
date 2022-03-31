<template>
    <v-data-table
        class="peptide-summary-table"
        :headers="headers"
        :items="items"
        :items-per-page="5"
        :server-items-length="totalItems"
        :options.sync="options"
        :loading="loading"
        loading-text="Loading items...">
        <template v-slot:progress>
            <v-progress-linear indeterminate height="2"></v-progress-linear>
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
import { ProteomicsAssay, CountTable, Peptide, Ontology, NcbiId, NcbiTaxon, PeptideData } from "unipept-web-components";
import { DataOptions } from "vuetify";
import { ShareableMap } from "shared-memory-datastructures";

export type PeptideSummary = {
    peptide: string,
    count: number,
    lca: string,
    rank: string
};

@Component({
    computed: {
        headers: {
            get() {
                return [
                    {
                        text: "Peptide",
                        align: "start",
                        value: "peptide",
                        width: "25%",
                        sortable: true
                    },
                    {
                        text: "Occurrence",
                        align: "start",
                        value: "count",
                        width: "20%",
                        sortable: true
                    }, {
                        text: "Lowest common ancestor",
                        align: "start",
                        value: "lca",
                        width: "35%",
                        sortable: false
                    }, {
                        text: "Rank",
                        align: "start",
                        value: "rank",
                        width: "20%",
                        sortable: false
                    }
                ];
            }
        }
    }
})
export default class PeptideSummaryTable extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;

    private items: PeptideSummary[] = [];
    private options = {};

    private loading: boolean = true;

    private showFiltered: boolean = false;

    get totalItems(): number {
        return this.peptideCountTable?.totalCount;
    }

    get peptideCountTable(): CountTable<Peptide> {
        return this.$store.getters.assayData(this.assay)?.filteredData?.peptideCountTable;
    }

    get lcaOntology(): Ontology<NcbiId, NcbiTaxon> {
        return this.$store.getters.assayData(this.assay)?.ncbiOntology;
    }

    get pept2Data(): ShareableMap<Peptide, PeptideData> {
        return this.$store.getters.assayData(this.assay)?.pept2Data;
    }

    @Watch("options", { deep: true })
    private async onOptionsChanged(options: DataOptions) {
        if (this.assay && this.peptideCountTable) {
            this.loading = true;
            const computedItems = [];

            const start = options.itemsPerPage * (options.page - 1);
            const end = Math.min(options.itemsPerPage * options.page, this.peptideCountTable.getOntologyIds().length);

            let peptides = this.peptideCountTable.getOntologyIds();
            if (options.sortBy.length > 0) {
                if (options.sortBy[0] === "count") {
                    peptides = peptides.sort((a: Peptide, b: Peptide) =>
                        this.peptideCountTable.getCounts(b) - this.peptideCountTable.getCounts(a)
                    );
                } else if (options.sortBy[0] === "peptide") {
                    // Simple sort alphabetically
                    peptides = peptides.sort();
                }
            }

            if (options.sortDesc.length > 0 && options.sortDesc[0]) {
                peptides = peptides.reverse();
            }

            for (const peptide of peptides.slice(start, end)) {
                const response = this.pept2Data.get(peptide);
                let lcaName = "N/A";
                let rank = "N/A"

                if (response) {
                    const taxon = this.lcaOntology.getDefinition(response.lca);
                    lcaName = taxon ? taxon.name : lcaName;
                    rank = taxon ? taxon.rank : rank;
                }

                computedItems.push({
                    peptide,
                    count: this.peptideCountTable.getCounts(peptide),
                    lca: lcaName,
                    rank
                })
            }

            this.items.splice(0, this.items.length);
            this.items.push(...computedItems);

            this.loading = false;
        }
    }

    @Watch("assay")
    @Watch("peptideCountTable", { immediate: true })
    private async onInputChanged() {
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

    private openPeptide(peptide: Peptide): void {
        this.$store.dispatch("analyseSinglePeptide", [peptide, this.assay.getSearchConfiguration().equateIl]);
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
