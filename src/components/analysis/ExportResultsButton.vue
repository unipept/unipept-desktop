<template>
    <div>
        <v-tooltip>
            <template v-slot:activator="{ on }">
                <v-menu offset-y bottom left origin="top right" v-on="on">
                    <template v-slot:activator="{ on }">
                        <v-btn min-width="187" :disabled="analysisLoading || exportLoading" v-on="on" color="default">
                            <div v-if="!exportLoading">
                                <v-icon>
                                    mdi-download
                                </v-icon>
                                {{ buttonText }}
                                <v-icon>mdi-menu-down</v-icon>
                            </div>
                            <v-progress-circular v-else indeterminate color="black" :size="20">
                            </v-progress-circular>
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-item @click="downloadCsv()">
                            <v-list-item-title>Comma-separated (international)</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="downloadCsv(';', ',')">
                            <v-list-item-title>Semi-colon-separated (Europe)</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="downloadCsv('\t', ';')">
                            <v-list-item-title>Tab-separated</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
            <span>Download a CSV-file with the results of this analysis.</span>
        </v-tooltip>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { ShareableMap } from "shared-memory-datastructures";
import {
    CountTable,
    EcCode,
    EcDefinition,
    GoCode,
    GoDefinition,
    InterproCode,
    InterproDefinition, NcbiId, NcbiTaxon,
    Peptide,
    Ontology,
    PeptideData, ProteomicsAssay, EcOntologyProcessor
} from "unipept-web-components";
import { dialog } from "@electron/remote";
import { promises as fs } from "fs";
import PeptideExport from "@/logic/analysis/PeptideExport";


@Component({})
export default class ExportResultsButton extends Vue {
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    @Prop({ required: false, default: "Download results" })
    private buttonText: string;

    private exportLoading = false;

    get peptideCountTable(): CountTable<Peptide> {
        return this.$store.getters.assayData(this.assay)?.filteredData.peptideCountTable;
    }

    get goOntology(): Ontology<GoCode, GoDefinition> {
        return this.$store.getters.assayData(this.assay)?.goOntology;
    }

    get ecOntology(): Ontology<EcCode, EcDefinition> {
        return this.$store.getters.assayData(this.assay)?.ecOntology;
    }

    get interproOntology(): Ontology<InterproCode, InterproDefinition> {
        return this.$store.getters.assayData(this.assay)?.interproOntology;
    }

    get ncbiOntology(): Ontology<NcbiId, NcbiTaxon> {
        return this.$store.getters.assayData(this.assay)?.ncbiOntology;
    }

    get pept2data(): ShareableMap<Peptide, PeptideData> {
        return this.$store.getters.assayData(this.assay)?.pept2Data;
    }

    get analysisLoading(): number {
        return this.$store.getters.assayData(this.assay).originalProgress.analysisInProgress;
    }

    private async downloadCsv(separator = ",", functionalSeparator = ";"): Promise<void> {
        if (this.assay && this.peptideCountTable) {
            this.exportLoading = true;

            const csv: string = await PeptideExport.exportSummaryAsCsv(
                this.peptideCountTable,
                this.pept2data,
                this.goOntology,
                this.ecOntology,
                this.interproOntology,
                this.ncbiOntology,
                separator,
                functionalSeparator
            );

            const result = await dialog.showSaveDialog(
                null,
                {
                    title: "save to CSV",
                    defaultPath: `${this.assay.getName()}_mpa.csv`
                }
            );

            if (!result.canceled) {
                await fs.writeFile(result.filePath, csv);
            }

            this.exportLoading = false;
        }
    }
}
</script>

<style scoped>

</style>
