<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <div style="max-width: 1200px; margin: auto;">
                    <h2 class="mx-auto settings-category-title">Configuration</h2>
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
                                        <v-select label="Datasource"></v-select>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col cols="8">
                                        <div class="settings-title">Rank</div>
                                        <span class="settings-text">
                                            Filter the results in the data table according to the rank selected here.
                                            Please note that items from multiple ranks can be selected simultaneously.
                                        </span>
                                    </v-col>
                                    <v-col cols="4">
                                        <v-select label="Rank"></v-select>
                                    </v-col>
                                </v-row>
                                <v-row>
<!--                                    <taxa-data-source-component>-->
<!--                                    </taxa-data-source-component>-->
                                </v-row>
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
import TaxaDataSourceComponent from "unipept-web-components/src/components/heatmap/TaxaDataSourceComponent.vue";

@Component({
    components: {
        TaxaDataSourceComponent
    }
})
export default class ComparativeAnalysisPage extends Vue {

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
