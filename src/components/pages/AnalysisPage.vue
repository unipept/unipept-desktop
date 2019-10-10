<template>
    <analysis-component :selected-datasets="this.$store.getters.selectedDatasets" :stored-datasets="this.$store.getters.storedDatasets" v-on:select-dataset="onSelectDataset"></analysis-component>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import AnalysisComponent from 'unipept-web-components/src/components/analysis/AnalysisComponent.vue';
import PeptideContainer from 'unipept-web-components/src/logic/data-management/PeptideContainer';

@Component({
    components: {
        AnalysisComponent
    }
})
export default class AnalysisPage extends Vue {
    private onSelectDataset(dataset: PeptideContainer): void {
        this.$store.dispatch('selectDataset', dataset);
        console.log(this.$store.getters.selectedDatasets);
    }
}
</script>

<style>

</style>
