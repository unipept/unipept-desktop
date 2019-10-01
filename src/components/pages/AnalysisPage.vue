<template>
    <analysis-component :selected-datasets="this.$store.getters.selectedDatasets" :stored-datasets="this.$store.getters.storedDatasets"></analysis-component>
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
