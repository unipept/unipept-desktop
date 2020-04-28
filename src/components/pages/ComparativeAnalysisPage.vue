<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <div style="max-width: 1200px; margin: auto;">
                    <h2 class="mx-auto settings-category-title">Data selection</h2>
                    <v-card>
                        <v-card-text>
                            <v-container fluid>
                                <multi-assay-data-source
                                    :assays="this.$store.getters.getSelectedAssays"
                                    v-on:selected-items="updateSelectedItems">
                                    <template slot-scope="props">
                                        <v-row>
                                            <v-col cols="8">
                                                <div class="settings-title">Datasource</div>
                                                <span class="settings-text">
                                                Which type of data would you like to compare over the selected samples?
                                            </span>
                                            </v-col>
                                            <v-col cols="4">
                                                <v-select label="Datasource" v-model="props.datasource" :items="props.datasources">
                                                </v-select>
                                            </v-col>
                                        </v-row>
                                    </template>
                                </multi-assay-data-source>
                            </v-container>
                        </v-card-text>
                    </v-card>
                    <h2 class="mx-auto settings-category-title">Normalization</h2>
                    <v-card>
                        <v-card-text>
                            <v-container fluid>
                                <v-row>
                                    <v-col sm="12" md="8">
                                        <normalization-selector v-on:update-normalizer="updateNormalizer">
                                        </normalization-selector>
                                    </v-col>
                                    <v-col md="4" class="hidden-sm-and-down">
                                        <div class="d-flex justify-center align-center" style="height: 100%;">
                                            <v-img v-if="normalizer.toString() === 'AllNormalizer'" alt="normalization explanation" max-height="300" src="../../../src/assets/images/normalization/all_normalizer.svg"/>
                                            <v-img v-else-if="normalizer.toString() === 'RowNormalizer'" alt="normalization explanation" max-height="300" src="../../../src/assets/images/normalization/row_normalizer.svg"/>
                                            <v-img v-else alt="normalization explanation" max-height="300" src="../../../src/assets/images/normalization/column_normalizer.svg"/>
                                        </div>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-card-text>
                    </v-card>
                    <h2 class="mx-auto settings-category-title">Visualization</h2>
                    <v-card>
                        <v-card-text>
                            <v-container fluid>
                                <v-row align="center" justify="center">
                                    <heatmap-multi-sample
                                        :selected-items="selectedItems"
                                        :normalizer="normalizer"
                                        :assays="this.$store.getters.getSelectedAssays">
                                    </heatmap-multi-sample>
                                </v-row>
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
import MultiAssayDataSourceItem from "unipept-web-components/src/components/heatmap/MultiAssayDataSourceItem";
import MultiAssayDataSource from "unipept-web-components/src/components/heatmap/MultiAssayDataSource.vue";
import HeatmapMultiSample from "unipept-web-components/src/components/heatmap/HeatmapMultiSample.vue";
import { Prop, Watch } from "vue-property-decorator";
import Normalizer from "unipept-web-components/src/business/normalisation/Normalizer";
import AllNormalizer from "unipept-web-components/src/business/normalisation/AllNormalizer";
import NormalizationSelector from "unipept-web-components/src/components/heatmap/NormalizationSelector.vue";

@Component({
    components: {
        MultiAssayDataSource,
        NormalizationSelector,
        HeatmapMultiSample
    },
    computed: {
        selectedIndex: {
            get(): number {
                return this.dataSources.indexOf(this.dataSource);
            }
        }
    }
})
export default class ComparativeAnalysisPage extends Vue {
    private selectedItems: MultiAssayDataSourceItem[] = [];
    private normalizer: Normalizer = new AllNormalizer();

    private updateSelectedItems(newItems: MultiAssayDataSourceItem[]) {
        this.selectedItems.length = 0;
        this.selectedItems.push(...newItems);
    }

    private updateNormalizer(normalizer: Normalizer) {
        this.normalizer = normalizer;
    }
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
