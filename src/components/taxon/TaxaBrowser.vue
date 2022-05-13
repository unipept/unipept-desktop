<template>
    <v-data-table
        :headers="headers"
        :items="taxa"
        :server-items-length="taxaCount"
        :loading="loading"
        :options.sync="options"
        dense>
        <template v-slot:item.action="{ item }">
            <v-simple-checkbox
                color="primary"
                :value="selectedItems.findIndex(val => val.id === item.id) !== -1"
                v-on:input="selectItem(item)">
            </v-simple-checkbox>
        </template>
        <template v-slot:footer.prepend>
            <span>{{ selectedItems.length }} taxa selected</span>
        </template>
        <template v-slot:body.append>
            <tr>
                <td></td>
                <td></td>
                <td>
                    <div class="d-flex align-center">
                        <v-text-field
                            dense
                            hide-details
                            clearable
                            v-model="search"
                            label="Filter"
                            class="my-4 mr-2"
                            :loading="filterLoading"
                            @keydown.enter="filterByName"
                            @click:clear="clearFilter"/>
                        <v-btn small @click="filterByName" :loading="filterLoading">
                            <v-icon>
                                mdi-magnify
                            </v-icon>
                        </v-btn>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-center">
                        <v-select :items="ranks" v-model="selectedRank"></v-select>
                    </div>
                </td>
                <td colspan="4"></td>
            </tr>
        </template>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DefaultCommunicationSource, NcbiId, NcbiOntologyProcessor, NcbiRank, NcbiTaxon, Ontology } from "unipept-web-components";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import { Prop, Watch } from "vue-property-decorator";
import { DataOptions } from "vuetify";

@Component
export default class TaxaBrowser extends Vue {
    private headers = [
        {
            text: "",
            align: "left",
            value: "action",
            width: "2%",
            sortable: false
        },
        {
            text: "Taxon ID",
            align: "start",
            value: "id",
            width: "15%"
        },
        {
            text: "Name",
            align: "start",
            value: "name",
            width: "45%"
        },
        {
            text: "Rank",
            align: "start",
            value: "rank",
            width: "38%"
        }
    ];

    private ranks: string[] = ["All"].concat([...Object.keys(NcbiRank)]);
    private selectedRank: string = "All";

    private search: string = "";

    private taxaCount: number = 0;
    private taxa: NcbiTaxon[] = [];

    private loading: boolean = true;

    private filterLoading: boolean = false;

    // @ts-ignore
    private options: DataOptions = {};

    private ncbiCommunicator: CachedNcbiResponseCommunicator;
    private ncbiOntologyProcessor: NcbiOntologyProcessor;

    private selectedItems: NcbiTaxon[] = [];

    private mounted() {
        this.loading = true;
        this.ncbiCommunicator = new CachedNcbiResponseCommunicator();
        this.ncbiOntologyProcessor = new NcbiOntologyProcessor(this.ncbiCommunicator);
        this.taxaCount = this.ncbiCommunicator.getNcbiCount();
        this.loading = false;
    }

    private async clearFilter(): Promise<void> {
        this.search = "";
        await this.filterByName();
    }

    private async filterByName(): Promise<void> {
        this.filterLoading = true;
        this.taxaCount = this.ncbiCommunicator.getNcbiCount(
            this.search,
            this.selectedRank === "All" ? "" : this.selectedRank
        );
        await this.onOptionsChanged();
        this.filterLoading = false;
    }

    @Watch("selectedRank")
    private async filterByRank(): Promise<void> {
        this.filterLoading = true;
        this.taxaCount = this.ncbiCommunicator.getNcbiCount(
            this.search,
            this.selectedRank === "All" ? "" : this.selectedRank
        );
        await this.onOptionsChanged();
        this.filterLoading = false;
    }

    @Watch("options")
    private async onOptionsChanged(): Promise<void> {
        if (this.ncbiOntologyProcessor && !this.loading) {
            const { sortBy, sortDesc, page, itemsPerPage } = this.options;

            const ncbis = this.ncbiCommunicator.getNcbiRange(
                itemsPerPage * (page - 1),
                itemsPerPage * page,
                this.search,
                this.selectedRank === "All" ? "" : this.selectedRank,
                (sortBy.length > 0 ? sortBy[0] : undefined) as "id" | "name" | "rank",
                sortDesc.length > 0 ? sortDesc[0] : undefined
            );

            const ontology: Ontology<NcbiId, NcbiTaxon> = await this.ncbiOntologyProcessor.getOntologyByIds(
                ncbis, false
            );

            this.taxa.splice(0, this.taxa.length);
            this.taxa.push(...ontology.toMap().values());
        }
    }

    @Watch("selectedItems")
    private onSelectedItemsChanged(): void {
        this.$emit("input", this.selectedItems);
    }

    private selectItem(item: NcbiTaxon): void {
        const idx = this.selectedItems.findIndex(element => element.id === item.id);
        if (idx === -1) {
            this.selectedItems.push(item);
        } else {
            this.selectedItems.splice(idx, 1);
        }
    }
}
</script>

<style scoped>

</style>
