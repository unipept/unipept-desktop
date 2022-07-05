<template>
    <v-dialog v-if="customDatabase" v-model="dialogActive" max-width="800px">
        <v-card>
            <v-card-title>
                {{ customDatabase.name }} - Detailed information
                <v-spacer></v-spacer>
                <v-btn icon @click="dialogActive = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="mt-2">
                <div>
                    <h3>General details</h3>
                </div>
                <div>
                    <h3>Taxa selected for filtering</h3>
                </div>
                <v-chip-group column>
                    <v-chip v-for="taxon in selectedTaxa" :key="taxon.id">{{ taxon.name }}</v-chip>
                </v-chip-group>
                <div class="d-flex justify-center">
                    <v-btn color="primary" @click="dialogActive = false">Close</v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { NcbiId, NcbiOntologyProcessor, NcbiTaxon, Ontology } from "unipept-web-components";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";

@Component
export default class CustomDatabaseInformationDialog extends Vue {
    @Prop({ required: true })
    private customDatabase: CustomDatabase;
    @Prop({ required: true })
    private value: boolean;

    private dialogActive: boolean = false;

    private selectedTaxa: NcbiTaxon[] = [];

    private ncbiOntologyProcessor: NcbiOntologyProcessor;

    private mounted() {
        const ncbiCommunicator = new CachedNcbiResponseCommunicator();
        this.ncbiOntologyProcessor = new NcbiOntologyProcessor(ncbiCommunicator);
    }

    @Watch("customDatabase")
    private async onDbChanged(): Promise<void> {
        if (this.customDatabase) {
            this.selectedTaxa.splice(0, this.selectedTaxa.length);

            const ontology: Ontology<NcbiId, NcbiTaxon> = await this.ncbiOntologyProcessor.getOntologyByIds(
                this.customDatabase.taxa
            );

            this.selectedTaxa.push(
                ...this.customDatabase.taxa.map(id => ontology.getDefinition(id)).filter(taxon => taxon)
            );
        }
    }

    @Watch("value")
    private onValueChanged() {
        this.dialogActive = this.value;
    }

    @Watch("dialogActive")
    private onDialogActiveChanged() {
        this.$emit("input", this.dialogActive);
    }
}
</script>

<style scoped>

</style>
