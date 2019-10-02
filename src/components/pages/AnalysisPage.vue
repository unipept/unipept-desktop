<template>
    <analysis-component :selected-datasets="this.$store.getters.selectedDatasets" :stored-datasets="this.$store.getters.storedDatasets"></analysis-component>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import AnalysisComponent from 'unipept-web-components/src/components/analysis/AnalysisComponent.vue';

@Component({
    components: {
        AnalysisComponent
    }
})
export default class AnalysisPage extends Vue {
}
</script>

<style>

</style>
