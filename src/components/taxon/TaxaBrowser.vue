<template>
    <v-data-table
        :headers="headers"
    >

    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DefaultCommunicationSource, NcbiOntologyProcessor, NcbiTaxon } from "unipept-web-components";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";

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
        // TODO retrieve all taxa (for this we need to add a new endpoint to the Unipept server that provides this
        // kind of information).
        const taxaOntologyProcessor = new NcbiOntologyProcessor(
            new DefaultCommunicationSource()
        );

        taxaOntologyProcessor.getOntologyByIds()
    }
}
</script>

<style scoped>

</style>
