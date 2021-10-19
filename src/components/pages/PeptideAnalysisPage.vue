<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <v-card>
                    <v-card-text class="mt-0">
                        <v-text-field
                            v-on:keyup.enter="openPeptide"
                            class="pt-0"
                            v-model="peptideModel"
                            label="Peptide"
                            single-line
                            @click:append-outer="openPeptide"
                            append-outer-icon="mdi-magnify"
                            hide-details>
                        </v-text-field>
                        <v-checkbox hide-details label="Equate I/L" v-model="equateIlModel"></v-checkbox>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <v-card>
                    <v-card-text>
                        <single-peptide-summary
                            v-if="peptide"
                            :communication-source="communicationSource"
                            :peptide="peptide"
                            :equate-il="equateIl">
                        </single-peptide-summary>
                        <div v-else>
                            <div class="display-1">Tryptic peptide analysis</div>
                            <div class="subtitle-1">Enter a peptide above to continue...</div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <single-peptide-analysis-card
                    :communication-source="communicationSource"
                    :equate-il="equateIl"
                    :peptide="peptide">
                </single-peptide-analysis-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
    CommunicationSource,
    DefaultCommunicationSource, NetworkConfiguration, Pept2DataCommunicator, Peptide,
    SinglePeptideAnalysisCard,
    SinglePeptideSummary
} from "unipept-web-components";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import ConfigureableCommunicationSource from "@/logic/communication/source/ConfigureableCommunicationSource";
import CachedGoResponseCommunicator from "@/logic/communication/functional/CachedGoResponseCommunicator";
import CachedEcResponseCommunicator from "@/logic/communication/functional/CachedEcResponseCommunicator";
import CachedInterproResponseCommunicator from "@/logic/communication/functional/CachedInterproResponseCommunicator";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";

@Component({
    components: { SinglePeptideAnalysisCard, SinglePeptideSummary }
})
export default class PeptideAnalysisPage extends Vue {
    private communicationSource: CommunicationSource = new ConfigureableCommunicationSource(
        new Pept2DataCommunicator(NetworkConfiguration.BASE_URL),
        new CachedGoResponseCommunicator(),
        new CachedEcResponseCommunicator(),
        new CachedInterproResponseCommunicator(),
        new CachedNcbiResponseCommunicator()
    );

    private peptideModel: Peptide = "";
    private equateIlModel: boolean = false;

    get peptide(): Peptide {
        return this.$store.getters["peptideSummary/selectedPeptide"];
    }

    get equateIl(): boolean {
        return this.$store.getters["peptideSummary/equateIl"];
    }

    private mounted() {
        this.peptideModel = this.peptide;
        this.equateIlModel = this.equateIl;
    }

    private openPeptide() {
        this.$store.dispatch("peptideSummary/setPeptide", [this.peptideModel, this.equateIlModel]);
    }
}
</script>

<style scoped>
    .theme--light.v-card > .v-card__text {
        color: #2c3e50;
    }
</style>
