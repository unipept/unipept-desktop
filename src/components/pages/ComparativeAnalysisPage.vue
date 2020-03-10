<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <div style="max-width: 1200px; margin: auto;">
                    <h2 class="mx-auto settings-category-title">Data selection</h2>
                    <v-card>
                        <v-card-text>
                            <v-container fluid>
                                <v-row>
                                    <v-col cols="8">
                                        <div class="settings-title">Datasource</div>
                                        <span class="settings-text">
                                            Which type of data would you like to compare over the selected samples?
                                        </span>
                                    </v-col>
                                    <v-col cols="4">
                                        <v-select label="Datasource" v-model="selectedDataSource" :items="dataSources">
                                        </v-select>
                                    </v-col>
                                </v-row>
                                <component
                                    :assays-in-comparison="$store.getters.getSelectedAssays"
                                    :is="dataSourceComponents[dataSources.indexOf(selectedDataSource)]">
                                </component>
                            </v-container>
                        </v-card-text>
                    </v-card>
                    <h2 class="mx-auto settings-category-title">Normalization</h2>
                    <v-card>
                        <v-card-text>
                            <v-container fluid>

                            </v-container>
                        </v-card-text>
                    </v-card>
                    <h2 class="mx-auto settings-category-title">Visualization</h2>
                    <v-card>
                        <v-card-text>
                            <v-container fluid>

                            </v-container>
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import ComparativeEcSource from "./../comparative/ComparativeEcSource.vue";

@Component({
    components: {
        ComparativeEcSource: ComparativeEcSource
    }
})
export default class ComparativeAnalysisPage extends Vue {
    private dataSources: string[] = ["Taxa", "EC-Numbers", "GO-Terms"];
    private dataSourceComponents: string[] = [
        "taxa-data-source-component",
        "comparative-ec-source",
        "go-data-source-component"
    ];

    private selectedDataSource: string = this.dataSources[0];
}
</script>

<style scoped lang="less">
    .settings-category-title:not(:first-child) {
        margin-top: 32px;
    }

    .settings-title {
        color: black;
        font-size: 18px;
    }

    .settings-important-text {
        font-style: italic;
        font-weight: bold;
    }
</style>
