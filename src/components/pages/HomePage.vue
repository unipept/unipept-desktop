<template>
    <v-container style="min-height: 100%;">
        <v-row style="min-height: 100%;">
            <v-col style="min-height: 100%;">
            <select-datasets-card 
                style="min-height: 100%;" 
                :selected-datasets="this.$store.getters.selectedDatasets"
                v-on:deselect-dataset="deselectDataset"
                v-on:start-analysis="startAnalysis">
            </select-datasets-card>
            </v-col>
            <v-col>
            <load-datasets-card 
                style="min-height: 100%;" 
                :selected-datasets="this.$store.getters.selectedDatasets"
                v-on:select-dataset="selectDataset"
                v-on:deselect-dataset="deselectDataset">
            </load-datasets-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import PeptideContainer from 'unipept-web-components/logic/data-management/PeptideContainer';

@Component({
  components: {}
})
export default class HomePage extends Vue {
  private selectDataset(value: PeptideContainer) {
    // @ts-ignore
    this.$store.dispatch("selectDataset", value);
  }

  private deselectDataset(value: PeptideContainer) {
    // @ts-ignore
    this.$store.dispatch("deselectDataset", value);
  }

  private startAnalysis() {
    this.$router.push('analysis');
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
