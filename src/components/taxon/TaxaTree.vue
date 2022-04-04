<template>
    <v-treeview :items="items" :load-children="fetchTaxa">

    </v-treeview>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { NcbiId, NcbiOntologyProcessor, NcbiTaxon } from "unipept-web-components";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";

type TaxonTreeItem = {
    name: string,
    rank: string,
    id: NcbiId,
    children: TaxonTreeItem[]
}

@Component
export default class TaxaTree extends Vue {
    private items: TaxonTreeItem[] = {
        name: "root",
        rank: "no rank",
        id: 1,
        children: []
    };

    private async mounted() {
        const ncbiCommunicator = new CachedNcbiResponseCommunicator();
        const ncbiOntologyProcessor = new NcbiOntologyProcessor(ncbiCommunicator);

        for (const id of ncbiCommunicator.getNcbiRange(0, 100, "", "no rank")) {
            const taxon: NcbiTaxon = await ncbiOntologyProcessor.getDefinition(id);
            this.items.push({
                name: taxon.name,
                rank: taxon.rank,
                id: taxon.id,
                children: []
            });
        }
    }

    private async fetchTaxa(item: TaxonTreeItem): Promise<TaxonTreeItem[]> {

        console.log("Fetching data for: ");
        console.log(item);

        return [];
    }
}
</script>

<style scoped>

</style>
