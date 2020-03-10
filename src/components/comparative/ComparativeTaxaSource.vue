<template>
    <div>
        <v-row>
            <v-col cols="8">
                <div class="settings-title">Namespace</div>
                <span class="settings-text">
                    Filter the results in the data table according to the namespace selected here.
                    Please note that items from multiple namespaces can be selected simultaneously.
                </span>
            </v-col>
            <v-col cols="4">
                <v-select label="Rank" :items="taxaRanks"></v-select>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <taxa-data-source-component
                    :assays-in-comparison="$store.getters.getSelectedAssays"
                    :rank="selectedRank"
                    v-on:selected-items="onSelectedItems"
                    :data-source="null">
                </taxa-data-source-component>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { EcNameSpace } from "unipept-web-components/src/logic/functional-annotations/EcNameSpace";
import TaxaDataSourceComponent from "unipept-web-components/src/components/heatmap/TaxaDataSourceComponent.vue";
import ECDefinition from "unipept-web-components/src/logic/data-management/ontology/ec/ECDefinition";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import { Prop } from "vue-property-decorator";
import { TaxumRank } from "unipept-web-components/src/logic/data-source/TaxumRank";
import NCBITaxon from "unipept-web-components/src/logic/data-management/ontology/taxa/NCBITaxon";

@Component({
    components: {
        TaxaDataSourceComponent
    }
})
export default class ComparativeTaxaSource extends Vue {
    @Prop({ required: true })
    private assaysInComparison: Assay[];

    private taxaRanks: string[] = ["all"].concat(Object.values(TaxumRank)).map(el => this.capitalize(el));
    private selectedRank: string = this.taxaRanks[0];

    private capitalize(n: string): string {
        return n.split(" ").map(el => el.length > 0 ? el.substr(0, 1).toUpperCase() + el.substr(1) : el).join(" ");
    }

    private onSelectedItems(items: NCBITaxon[]): void {
        this.$emit("selected-items", items);
    }
}
</script>

<style scoped>
    .settings-title {
        color: black;
        font-size: 18px;
    }

    .settings-important-text {
        font-style: italic;
        font-weight: bold;
    }
</style>
