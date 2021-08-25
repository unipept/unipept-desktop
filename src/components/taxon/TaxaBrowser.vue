<template>
    <v-data-table
        :headers="headers"
        :items="taxa"
        :server-items-length="ncbis.length"
        :loading="loading"
        :options.sync="options"
        show-select>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DefaultCommunicationSource, NcbiId, NcbiOntologyProcessor, NcbiTaxon, Ontology } from "unipept-web-components";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import { Watch } from "vue-property-decorator";

@Component
export default class TaxaBrowser extends Vue {
    private headers = [
        {
            text: "Taxon ID",
            align: "start",
            value: "id"
        },
        {
            text: "Name",
            align: "start",
            value: "name"
        },
        {
            text: "Rank",
            align: "start",
            value: "rank"
        }
    ]

    private ncbis: NcbiId[] = [];
    private taxa: NcbiTaxon[] = [];

    private loading: boolean = true;

    private options = {};

    private ncbiOntologyProcessor: NcbiOntologyProcessor;

    private mounted() {
        this.loading = true;
        this.retrieveAllTaxa();
        this.loading = false;
    }

    @Watch("options")
    private async onOptionsChanged(): Promise<void> {
        if (this.ncbiOntologyProcessor && this.ncbis) {
            const { sortBy, sortDesc, page, itemsPerPage } = this.options;

            const ontology: Ontology<NcbiId, NcbiTaxon> = await this.ncbiOntologyProcessor.getOntologyByIds(
                this.ncbis.slice(itemsPerPage * (page - 1), itemsPerPage * page), false
            );

            this.taxa.splice(0, this.taxa.length);
            this.taxa.push(...ontology.toMap().values());
        }
    }

    private async retrieveAllTaxa(): Promise<void> {
        const ncbiManager = new CachedNcbiResponseCommunicator();
        for (const item of ncbiManager.getAllNcbiIds()) {
            this.ncbis.push(item);
        }
        this.ncbiOntologyProcessor = new NcbiOntologyProcessor(ncbiManager);
    }
}
</script>

<style scoped>

</style>
