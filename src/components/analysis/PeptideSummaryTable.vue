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
        <template v-slot:footer.prepend>
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <div v-on="on" class="d-flex align-center flex-grow-1">
                        <v-text-field
                            v-model="search"
                            dense
                            label="Filter"
                            class="mr-2"
                            hide-details
                            clearable
                            :disabled="loading"
                            @click:clear="clearSearch"
                            @keydown.enter="performSearch">
                        </v-text-field>
                        <v-btn small class="mr-6" @click="performSearch" :disabled="loading">
                            <v-icon>mdi-magnify</v-icon>
                        </v-btn>
                    </div>
                </template>
                <span>Filter peptides by name, lowest common ancestor or rank.</span>
            </v-tooltip>

        </template>
        <template v-slot:progress>
            <v-progress-linear indeterminate height="2"></v-progress-linear>
        </template>
        <template v-slot:item.peptide="{ item }">
            <div class="sequence-value" :title="item.peptide">
                <a @click="openPeptide(item.peptide)" v-html="highlightFilter(item.peptide, currentSearch)"></a>
            </div>
        </template>
        <template v-slot:item.lca="{ item }">
            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <div v-on="on">
                        <a @click="filterByLca(item.lcaId)" v-html="highlightFilter(item.lca, currentSearch)"></a>
                    </div>
                </template>
                <span>Click to filter results by this organism.</span>
            </v-tooltip>
        </template>
        <template v-slot:item.rank="{ item }">
            <div :title="item.rank" v-html="highlightFilter(item.rank, currentSearch)"></div>
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
    rank: string,
    lcaId: NcbiId
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

    private peptides: Peptide[] = [];

    private items: PeptideSummary[] = [];
    private options = {};

    private loading: boolean = true;

    private search: string = "";
    private currentSearch: string = "";

    get totalItems(): number {
        return this.peptides.length;
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

    /**
     * Generate a set of HTML-elements that can be used to highlight part of a text.
     *
     * @param text This is the text in which the given filter will be looked up and highlighted.
     * @param filter The filter that should be found in the given text and which should be highlighted.
     * @return A string that contains a set of HTML span-element's that highlight the required part of the text.
     */
    private highlightFilter(text: string, filter: string): string {
        if (filter.length === 0) {
            return `<span>${text}</span>`
        }

        let html: string = "";

        let previousEnding: number = 0;
        let filterStart: number = text.toLowerCase().indexOf(filter.toLowerCase(), previousEnding);
        while (filterStart !== -1) {
            if (previousEnding !== filterStart) {
                html += `<span>${text.slice(previousEnding, filterStart)}</span>`
            }
            html += `<span style="background-color: yellow;">${text.slice(filterStart, filterStart + filter.length)}</span>`;
            previousEnding = filterStart + filter.length;
            filterStart = text.toLowerCase().indexOf(filter.toLowerCase(), previousEnding);
        }

        if (previousEnding !== text.length) {
            html += `<span>${text.slice(previousEnding)}</span>`;
        }

        return html;
    }

    /**
     * Apply the current filter state of the application to the NCBI ID that's given as an argument to this function.
     *
     * @param filterId
     */
    private filterByLca(filterId: NcbiId): void {
        this.$store.dispatch("filterAssayByTaxon", [this.assay, filterId]);
    }

    private async clearSearch() {
        this.search = "";
        this.performSearch();
    }

    private async performSearch() {
        this.loading = true;
        if (!this.search) {
            this.search = "";
            this.peptides = this.peptideCountTable.getOntologyIds();
        } else {
            const lowercaseSearch = this.search.toLowerCase();

            this.peptides = this.peptideCountTable.getOntologyIds().filter((p: Peptide) => {
                const response = this.pept2Data.get(p);
                if (response) {
                    const taxon = this.lcaOntology.getDefinition(response.lca);
                    return taxon && (
                        taxon.name.toLowerCase().includes(lowercaseSearch) ||
                        taxon.rank.toLowerCase().includes(lowercaseSearch) ||
                        p.toLowerCase().includes(lowercaseSearch)
                    );
                }
                return false;
            });
        }

        this.currentSearch = this.search;

        this.onOptionsChanged({
            page: 1,
            itemsPerPage: 5,
            sortBy: [],
            sortDesc: [],
            multiSort: false,
            mustSort: false,
            groupBy: [],
            groupDesc: []
        });

        this.loading = false;
    }

    @Watch("options", { deep: true })
    private async onOptionsChanged(options: DataOptions) {
        if (this.assay && this.peptideCountTable) {
            this.loading = true;
            const computedItems = [];

            const start = options.itemsPerPage * (options.page - 1);
            const end = Math.min(options.itemsPerPage * options.page, this.peptideCountTable.getOntologyIds().length);

            let peptides = this.peptides;
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
                    rank,
                    lcaId: response.lca
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
        this.search = "";
        await this.performSearch();
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
