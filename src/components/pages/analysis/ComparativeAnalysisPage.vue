<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <div style="margin: auto;">
                    <collapsable-card>
                        <template v-slot:title><span>Data selection</span></template>
                        <template v-slot:content>
                            <v-card>
                                <v-card-text>
                                    <v-container fluid>
                                        <multi-assay-data-source
                                            :communication-source="communicationSource"
                                            :assays="$store.getters.getSelectedAssays"
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
                                                        <v-select
                                                            label="Datasource"
                                                            v-on:change="props.updateDatasource"
                                                            v-model="props.datasource"
                                                            :items="props.datasources">
                                                        </v-select>
                                                    </v-col>
                                                </v-row>
                                            </template>
                                        </multi-assay-data-source>
                                    </v-container>
                                </v-card-text>
                            </v-card>
                        </template>
                    </collapsable-card>
                    <collapsable-card>
                        <template v-slot:title><span>Normalization</span></template>
                        <template v-slot:content>
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
                                                    <v-img v-if="normalizer.toString() === 'AllNormalizer'" alt="normalization explanation" max-height="300" src="../../../../src/assets/images/normalization/all_normalizer.svg"/>
                                                    <v-img v-else-if="normalizer.toString() === 'RowNormalizer'" alt="normalization explanation" max-height="300" src="../../../../src/assets/images/normalization/row_normalizer.svg"/>
                                                    <v-img v-else alt="normalization explanation" max-height="300" src="../../../../src/assets/images/normalization/column_normalizer.svg"/>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </v-container>
                                </v-card-text>
                            </v-card>
                        </template>
                    </collapsable-card>
                    <collapsable-card>
                        <template v-slot:title><span>Visualization</span></template>
                        <template v-slot:content>
                            <v-card>
                                <v-card-text>
                                    <v-container fluid>
                                        <v-row align="center" justify="center">
                                            <heatmap-multi-sample
                                                :selected-items="selectedItems"
                                                :normalizer="normalizer"
                                                :assays="$store.getters.getSelectedAssays">
                                            </heatmap-multi-sample>
                                        </v-row>
                                    </v-container>
                                </v-card-text>
                            </v-card>
                        </template>
                    </collapsable-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
    MultiAssayDataSourceItem,
    MultiAssayDataSource,
    HeatmapMultiSample,
    Normalizer,
    AllNormalizer,
    NormalizationSelector,
    DefaultCommunicationSource,
    CommunicationSource, NetworkConfiguration
} from "unipept-web-components";

import { Prop, Watch } from "vue-property-decorator";
import CollapsableCard from "@/components/pages/CollapsableCard.vue";

@Component({
    components: {
        CollapsableCard,
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
    private communicationSource: CommunicationSource = new DefaultCommunicationSource(NetworkConfiguration.BASE_URL);

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
