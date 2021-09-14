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
                    <v-text-field
                        dense
                        hide-details
                        v-model="search"
                        label="Filter"
                        class="my-4"
                    ></v-text-field>
                </td>
                <td colspan="4"></td>
            </tr>
        </template>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DefaultCommunicationSource, NcbiId, NcbiOntologyProcessor, NcbiTaxon, Ontology } from "unipept-web-components";
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

    private search: string = "";

    private taxaCount: number = 0;
    private taxa: NcbiTaxon[] = [];

    private loading: boolean = true;

    // @ts-ignore
    private options: DataOptions = {};

    private ncbiCommunicator: CachedNcbiResponseCommunicator;
    private ncbiOntologyProcessor: NcbiOntologyProcessor;

    private searchDebounceTimer: NodeJS.Timeout;

    private selectedItems: NcbiTaxon[] = [];

    private mounted() {
        this.loading = true;
        this.ncbiCommunicator = new CachedNcbiResponseCommunicator();
        this.ncbiOntologyProcessor = new NcbiOntologyProcessor(this.ncbiCommunicator);
        this.taxaCount = this.ncbiCommunicator.getNcbiCount();
        this.loading = false;
    }

    @Watch("search")
    private async onSearchChanged(): Promise<void> {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        this.searchDebounceTimer = setTimeout(() => {
            this.taxaCount = this.ncbiCommunicator.getNcbiCount(this.search);
            this.searchDebounceTimer = null;
        }, 500);
    }

    @Watch("options")
    @Watch("search")
    private async onOptionsChanged(): Promise<void> {
        if (this.ncbiOntologyProcessor && !this.loading) {
            const { sortBy, sortDesc, page, itemsPerPage } = this.options;

            const ncbis = await this.ncbiCommunicator.getNcbiRange(
                itemsPerPage * (page - 1),
                itemsPerPage * page,
                this.search,
                sortBy.length > 0 ? sortBy[0] : undefined,
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
