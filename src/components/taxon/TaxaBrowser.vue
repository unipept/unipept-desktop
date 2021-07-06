<template>
    <v-data-table
        :headers="headers"
        show-select>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DefaultCommunicationSource, NcbiOntologyProcessor, NcbiTaxon } from "unipept-web-components";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";

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

    private taxa: NcbiTaxon[] = [];

    private async retrieveAllTaxa(): Promise<void> {
        const ncbiManager = new CachedNcbiResponseCommunicator();
        const ncbis = ncbiManager.getAllNcbiIds();
    }
}
</script>

<style scoped>

</style>
