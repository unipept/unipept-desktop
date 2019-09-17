<template>
    <v-container>
        <v-row>
            <v-col>
                <switch-datasets-card></switch-datasets-card>
            </v-col>
            <v-col>
                <experiment-summary-card v-if="!this.$store.getters.isDatasetSelectionInProgress"></experiment-summary-card>
                <load-datasets-card v-else></load-datasets-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component
export default class AnalysisPage extends Vue {

}
</script>

<style>

</style>