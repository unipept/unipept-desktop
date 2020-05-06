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
                        <search-settings-form
                            :horizontal="true"
                            :equate-il.sync="equateIl"
                            :filter-duplicates.sync="filterDuplicates"
                            :missing-cleavage.sync="missedCleavage">
                        </search-settings-form>

                        <div class="d-flex justify-center align-center mt-4">
                            <v-btn :disabled="progress !== 1" color="primary" @click="update()">Update</v-btn>
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
        <v-card-text class="d-flex justify-center align-center">
            <v-progress-circular :size="70" :width="7" color="primary" indeterminate></v-progress-circular>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import PeptideSummaryTable from "@/components/analysis/PeptideSummaryTable.vue";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import SearchSettingsForm from "unipept-web-components/src/components/analysis/SearchSettingsForm.vue";
import Project from "@/logic/filesystem/project/Project";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";

@Component({
    components: { PeptideSummaryTable, SearchSettingsForm },
    computed: {
        progress: {
            get(): number {
                return this.project.getProcessingResults(this.assay).progress;
            }
        }
    }
})
export default class AnalysisSummary extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: true })
    private peptideCountTable: CountTable<Peptide>;
    @Prop({ required: true })
    private project: Project;

    private equateIl: boolean = true;
    private filterDuplicates: boolean = true;
    private missedCleavage: boolean = false;

    mounted() {
        this.onAssayChanged();
    }

    @Watch("assay")
    private onAssayChanged() {
        if (this.assay) {
            const config = this.assay.getSearchConfiguration();
            this.equateIl = config.equateIl;
            this.filterDuplicates = config.filterDuplicates;
            this.missedCleavage = config.enableMissingCleavageHandling;
        }
    }

    private update() {
        const config = new SearchConfiguration(this.equateIl, this.filterDuplicates, this.missedCleavage);
        this.assay.setSearchConfiguration(config);
        this.project.processAssay(this.assay);
    }
}
</script>

<style scoped>

</style>
