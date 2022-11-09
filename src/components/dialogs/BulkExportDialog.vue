<template>
    <v-dialog v-model="exportDialogActive" width="1200">
        <v-card>
            <v-card-title>Bulk export assay results</v-card-title>
            <v-card-text>
                <p>
                    All peptide results for the assays in this study will be exported. Please select a directory in
                    which to save the export files.
                </p>
                <div class="d-flex align-center">
                    <v-text-field prepend-icon="mdi-folder" class="mr-2" v-model="directory" @click="selectDirectory">
                    </v-text-field>
                    <v-btn color="primary" @click="exportAssays">
                        <v-icon>
                            mdi-download
                        </v-icon>
                        Export results
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { AssayAnalysisStatus, Study } from "unipept-web-components";
import PeptideExport from "@/logic/analysis/PeptideExport";
import { promises as fs } from "fs";
import path from "path";
import { dialog } from "@electron/remote";

@Component
export default class BulkExportDialog extends Vue {
    @Prop({ required: true })
    private value: boolean;
    @Prop({ required: true })
    private study: Study;

    private exportDialogActive = false;

    private directory = "";

    mounted() {
        this.onValueChanged();
    }

    private async exportAssays() {
        const separator = ";";
        const functionalSeparator = ",";

        for (const assay of this.study.getAssays()) {
            const assayData: AssayAnalysisStatus = this.$store.getters.assayData(assay);

            const peptideCountTable = assayData.filteredData.peptideCountTable;
            const pept2data = assayData.pept2Data;
            const goOntology = assayData.goOntology;
            const ecOntology = assayData.ecOntology;
            const interproOntology = assayData.interproOntology;
            const ncbiOntology = assayData.ncbiOntology;

            const csv: string = await PeptideExport.exportSummaryAsCsv(
                peptideCountTable,
                pept2data,
                goOntology,
                ecOntology,
                interproOntology,
                ncbiOntology,
                separator,
                functionalSeparator
            );

            const fileName = `${assay.getName()}.csv`;

            await fs.writeFile(path.join(this.directory, fileName), csv);

            console.log("Wrote data for " + assay.getName());
        }
    }

    @Watch("value")
    private onValueChanged() {
        this.exportDialogActive = this.value;
    }

    @Watch("exportDialogActive")
    private onExportDialogActiveChanged() {
        this.$emit("input", this.exportDialogActive);
    }

    private selectDirectory() {
        const result = dialog.showOpenDialogSync({
            properties: ["openDirectory"]
        });

        if (result) {
            this.directory = result[0];
        }
    }
}
</script>

<style scoped>

</style>
