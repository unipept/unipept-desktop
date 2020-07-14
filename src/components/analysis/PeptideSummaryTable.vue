<template>
    <v-data-table
        class="peptide-summary-table"
        :headers="headers"
        :items="items"
        :items-per-page="5"
        :server-items-length="totalItems"
        :options.sync="options"
        :loading="isLoading || progress !== 1"
        :loading-text="'Loading items: ' + Math.round(computeProgress * 100) + '%'">
        <template v-slot:progress>
            <v-progress-linear :value="computeProgress * 100" height="2"></v-progress-linear>
        </template>
        <template v-slot:item.peptide="{ item }">
            <div class="sequence-value" :title="item.peptide">{{ item.peptide }}</div>
        </template>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { spawn, Worker } from "threads";
import { DataOptions } from "vuetify";
import { AssayData } from "unipept-web-components/src/state/AssayStore";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import NcbiTaxon from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { Ontology } from "unipept-web-components/src/business/ontology/Ontology";

@Component({
    computed: {
        progress: {
            get(): number {
                const assayData: AssayData = this.$store.getters.assayData(this.assay);
                return assayData ? assayData.analysisMetaData.progress : 0;
            }
        },
        headers: {
            get() {
                return [
                    {
                        text: "Peptide",
                        align: "start",
                        value: "peptide",
                        width: "30%"
                    },
                    {
                        text: "Occurrence",
                        align: "start",
                        value: "count",
                        width: "15%"
                    }, {
                        text: "Lowest common ancestor",
                        align: "start",
                        value: "lca",
                        width: "35%"
                    }, {
                        text: "Rank",
                        align: "start",
                        value: "rank",
                        width: "20%"
                    }
                ];
            }
        }
    }
})
export default class PeptideSummaryTable extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;

    // This worker keeps track of the data for this table and computes it on demand.
    private static worker;

    private totalItems: number = 0;
    private items = [];

    private options = {};

    private loading: boolean = false;
    private computeProgress: number = 0;

    private async mounted() {
        if (!PeptideSummaryTable.worker) {
            PeptideSummaryTable.worker = await spawn(new Worker("./PeptideSummaryTable.worker.ts"));
        }
        await this.computeItems();
    }

    get peptideCountTable(): CountTable<Peptide> {
        return this.$store.getters.assayData(this.assay)?.peptideCountTable;
    }

    get pept2dataCommunicator(): Pept2DataCommunicator {
        return this.$store.getters.assayData(this.assay)?.communicationSource.getPept2DataCommunicator();
    }

    get lcaOntology(): Ontology<NcbiId, NcbiTaxon> {
        return this.$store.getters["ncbi/ontology"](this.assay);
    }

    get isLoading(): boolean {
        return this.lcaOntology === undefined || this.pept2dataCommunicator === undefined || this.loading;
    }

    @Watch("options", { deep: true })
    private async onOptionsChanged(newOptions: DataOptions) {
        if (PeptideSummaryTable.worker) {
            this.items = await PeptideSummaryTable.worker.getItems(newOptions);
        }
    }

    @Watch("peptideCountTable")
    @Watch("lcaOntology")
    @Watch("pept2dataCommunicator")
    private async computeItems() {
        this.items.splice(0, this.items.length);

        const assayData: AssayData = this.$store.getters.assayData(this.assay);

        if (assayData && assayData.peptideCountTable && this.lcaOntology && this.pept2dataCommunicator) {
            this.loading = true;

            const peptideCountTable = assayData.peptideCountTable;

            this.totalItems = peptideCountTable.getOntologyIds().length;
            const pept2DataCommunicator = assayData.communicationSource.getPept2DataCommunicator();
            const buffers = pept2DataCommunicator.getPeptideResponseMap(this.assay.getSearchConfiguration()).getBuffers();

            await PeptideSummaryTable.worker.setPept2DataMap(buffers[0], buffers[1]);
            await PeptideSummaryTable.worker.setPeptideCountTable(peptideCountTable.toMap());

            const lcaOntology = this.$store.getters["ncbi/ontology"](this.assay);
            await PeptideSummaryTable.worker.setLcaOntology(lcaOntology);

            const obs = PeptideSummaryTable.worker.computeItems();
            await new Promise((resolve, reject) => {
                obs.subscribe(
                    (val) => this.computeProgress = val,
                    (err) => reject(err),
                    () => resolve(),
                );
            });

            await this.onOptionsChanged({
                page: 1,
                itemsPerPage: 5,
                sortBy: [],
                sortDesc: [],
                multiSort: false,
                mustSort: false,
                groupBy: [],
                groupDesc: []
            });

            this.loading = false;
        }
    }
}
</script>

<style scoped>
    .sequence-value {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
