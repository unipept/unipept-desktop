<template>
    <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page="5"
        :server-items-length="totalItems"
        :options.sync="options"
        :loading="loading || progress !== 1"
        :loading-text="'Loading items: ' + Math.round(computeProgress * 100) + '%'">
        <template v-slot:progress>
            <v-progress-linear :value="computeProgress * 100" height="2"></v-progress-linear>
        </template>
        <template v-slot:item.matched="{ item }">
            <v-tooltip v-if="item.matched" bottom>
                <template v-slot:activator="{ on }">
                    <v-icon v-on="on">mdi-check</v-icon>
                </template>
                <span>This peptide was matched with at least one protein.</span>
            </v-tooltip>
            <v-tooltip v-else bottom>
                <template v-slot:activator="{ on }">
                    <v-icon>mdi-close</v-icon>
                </template>
                <span>We were unable to match this peptide with a protein.</span>
            </v-tooltip>
        </template>
    </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import NcbiOntologyProcessor from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiOntologyProcessor";
import Project from "@/logic/filesystem/project/Project";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import { spawn, Worker } from "threads";
import { DataOptions } from "vuetify";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";

@Component({
    computed: {
        progress: {
            get(): number {
                if (this.project) {
                    return this.project.getProcessingResults(this.assay).progress;
                } else {
                    return 0;
                }
            }
        }
    }
})
export default class PeptideSummaryTable extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: true })
    private project: Project;
    @Prop({ required: true })
    private peptideCountTable: CountTable<Peptide>;
    @Prop({ required: true })
    private communicationSource: CommunicationSource;

    // This worker keeps track of the data for this table and computes it on demand.
    private static worker;

    private totalItems: number = 0;
    private items = [];

    private options = {};

    private loading: boolean = false;
    private computeProgress: number = 0;

    private headers = [
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
            width: "20%"
        }, {
            text: "Lowest common ancestor",
            align: "start",
            value: "lca",
            width: "30%"
        }, {
            text: "Matched?",
            align: "center",
            value: "matched",
            width: "20%"
        }
    ]

    private async mounted() {
        PeptideSummaryTable.worker = await spawn(new Worker("./PeptideSummaryTable.worker.ts"));
        await this.computeItems();
    }

    @Watch("options", { deep: true })
    private async onOptionsChanged(newOptions: DataOptions) {
        if (PeptideSummaryTable.worker) {
            this.items = await PeptideSummaryTable.worker.getItems(newOptions);
        }
    }

    @Watch("assay.searchConfiguration")
    private async onSearchConfigChanged(oldConfig: SearchConfiguration, newConfig: SearchConfiguration) {
        if (
            oldConfig.equateIl !== newConfig.equateIl ||
            oldConfig.filterDuplicates !== newConfig.filterDuplicates ||
            oldConfig.enableMissingCleavageHandling !== newConfig.enableMissingCleavageHandling
        ) {
            await this.computeItems();
        }
    }

    @Watch("peptideCountTable")
    private async onPeptideCountTableChanged() {
        await this.computeItems();
    }

    private async computeItems() {
        this.items.splice(0, this.items.length);

        if (this.peptideCountTable) {
            this.loading = true;

            this.totalItems = this.peptideCountTable.getOntologyIds().length;
            const pept2DataCommunicator = this.communicationSource.getPept2DataCommunicator();
            await pept2DataCommunicator.process(this.peptideCountTable, this.assay.getSearchConfiguration());
            const buffers = pept2DataCommunicator.getPeptideResponseMap(this.assay.getSearchConfiguration()).getBuffers();

            await PeptideSummaryTable.worker.setPept2DataMap(buffers[0], buffers[1]);
            await PeptideSummaryTable.worker.setPeptideCountTable(this.peptideCountTable.toMap());

            const lcaOntology = await (new NcbiOntologyProcessor(this.communicationSource)).getOntologyByIds(
                await PeptideSummaryTable.worker.getLcaIds()
            );
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

</style>
