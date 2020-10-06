<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <v-card>
                    <v-card-title>Tryptic peptide analysis</v-card-title>
                    <v-card-text>
                        <single-peptide-summary
                            :communication-source="communicationSource"
                            :peptide="peptide"
                            :equate-il="true">
                        </single-peptide-summary>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <single-peptide-analysis-card
                    :communication-source="communicationSource"
                    :equate-il="true"
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
    SinglePeptideAnalysisCard
} from "unipept-web-components";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";

@Component({
    components: { SinglePeptideAnalysisCard }
})
export default class PeptideAnalysisPage extends Vue {
    private communicationSource: CommunicationSource = new CachedCommunicationSource();
    private peptide: string = "AALTER";
}
</script>

<style scoped>

</style>
