<template>
    <div>
        <v-alert prominent type="error" text class="ma-2" v-if="peptideErrorOccurred">
            An error occurred while processing this peptide. Details about this specific error are shown below. If you
            believe that this error is not the result of a user action, then please contact us and provide the error
            details below. Make sure to check your internet connection before continuing.

            <div class="font-weight-bold">Error details</div>
            <div>{{ peptideErrorObject ? peptideErrorObject.stack : peptideErrorMessage }}</div>
        </v-alert>

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

            <div v-if="!peptide">
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-text>
                                <div class="display-1">Tryptic peptide analysis</div>
                                <div class="subtitle-1">Enter a peptide above to continue...</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </div>

            <div v-else-if="isAnalysisInProgress">
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-text class="d-flex flex-column align-center">
                                <v-progress-circular indeterminate color="primary" size="40" />
                                <span>Processing your request...</span>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </div>

            <div v-else-if="peptideErrorOccurred">
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-text>
                                <span>Information not available...</span>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </div>

            <div v-else>
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-text>
                                <single-peptide-summary />
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <single-peptide-analysis-card />
                    </v-col>
                </v-row>
            </div>
        </v-container>
    </div>
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
    private peptideModel: Peptide = "";
    private equateIlModel: boolean = false;

    get peptide(): Peptide {
        return this.$store.getters.peptideStatus.peptide;
    }

    get equateIl(): boolean {
        return this.$store.getters.peptideStatus.equateIl;
    }

    get isAnalysisInProgress(): boolean {
        return this.$store.getters.peptideStatus.analysisInProgress;
    }

    get peptideErrorOccurred(): boolean {
        return this.$store.getters.peptideStatus.error.status;
    }

    get peptideErrorMessage(): string {
        return this.$store.getters.peptideStatus.error.message;
    }

    get peptideErrorObject(): Error {
        return this.$store.getters.peptideStatus.error.object;
    }

    private mounted() {
        this.peptideModel = this.peptide;
        this.equateIlModel = this.equateIl;
    }

    private openPeptide() {
        this.$store.dispatch("analyseSinglePeptide", [this.peptideModel, this.equateIlModel]);
    }
}
</script>

<style scoped>
    .theme--light.v-card > .v-card__text {
        color: #2c3e50;
    }
</style>
