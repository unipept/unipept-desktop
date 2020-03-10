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
                <v-select label="Namespace" :items="ecNameSpaces"></v-select>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <ec-data-source-component
                    :assays-in-comparison="$store.getters.getSelectedAssays"
                    :namespace="selectedNameSpace"
                    v-on:selected-items="onSelectedItems"
                    :data-source="null">
                </ec-data-source-component>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { EcNameSpace } from "unipept-web-components/src/logic/functional-annotations/EcNameSpace";
import EcDataSourceComponent from "unipept-web-components/src/components/heatmap/EcDataSourceComponent.vue";
import ECDefinition from "unipept-web-components/src/logic/data-management/ontology/ec/ECDefinition";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import { Prop } from "vue-property-decorator";

@Component({
    components: {
        EcDataSourceComponent
    }
})
export default class ComparativeEcSource extends Vue {
    @Prop({ required: true })
    private assaysInComparison: Assay[];

    private ecNameSpaces: string[] = ["all"].concat(Object.values(EcNameSpace)).map(el => this.capitalize(el));
    private selectedNameSpace: string = this.ecNameSpaces[0];

    private capitalize(n: string): string {
        return n.split(" ").map(el => el.length > 0 ? el.substr(0, 1).toUpperCase() + el.substr(1) : el).join(" ");
    }

    private onSelectedItems(items: ECDefinition[]): void {
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
