<template>
    <v-card v-if="assay">
        <v-card-title>
            {{ assay.getName() }}
        </v-card-title>
        <v-card-subtitle>
            Analysis summary
        </v-card-subtitle>
        <v-card-text>
            <v-container fluid>
                <v-row>
                    <v-col>
                        <v-simple-table>
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Database</td>
                                        <td>UniProt</td>
                                    </tr>
                                    <tr>
                                        <td>Database version</td>
                                        <td>2020.01</td>
                                    </tr>
                                    <tr>
                                        <td>Analysis last updated on</td>
                                        <td>05-05-2020 at 13:28</td>
                                    </tr>
                                    <tr>
                                        <td>Endpoint</td>
                                        <td>https://unipept.ugent.be</td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                        <div class="d-flex justify-space-between">
                            <v-checkbox label="Equate I and L" hide-details></v-checkbox>
                            <v-checkbox label="Filter duplicates" hide-details></v-checkbox>
                            <v-checkbox label="Advanced missing cleavage" hide-details></v-checkbox>
                        </div>

                        <div class="d-flex justify-center align-center mt-4">
                            <v-btn color="primary">Update</v-btn>
                        </div>
                    </v-col>
                    <v-divider vertical></v-divider>
                    <v-col>
                        <peptide-summary-table
                            :assay="assay"
                            :peptide-count-table="peptideCountTable">
                        </peptide-summary-table>
                    </v-col>
                </v-row>
            </v-container>
        </v-card-text>
    </v-card>
    <v-card v-else>
        <v-card-text>

        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import PeptideSummaryTable from "@/components/analysis/PeptideSummaryTable.vue";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import SearchSettingsForm from "unipept-web-components/src/components/analysis/SearchSettingsForm.vue";

@Component({
    components: { PeptideSummaryTable, SearchSettingsForm }
})
export default class AnalysisSummary extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: true })
    private peptideCountTable: CountTable<Peptide>;


}
</script>

<style scoped>

</style>
