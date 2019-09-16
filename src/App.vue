<template>
  <div id="app" style="min-height: 100vh;">
    <v-app style="min-height: 100%;">
      <v-container style="min-height: 100%;">
        <v-row style="min-height: 100%;">
          <v-col style="min-height: 100%;">
            <select-datasets-card 
              style="min-height: 100%;" 
              :selected-datasets="this.$store.getters.selectedDatasets"
              v-on:deselect-dataset="deselectDataset">
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
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';
import PeptideContainer from 'unipept-web-components/logic/data-management/PeptideContainer';

@Component({
  components: {
    HelloWorld,
  }
})
export default class App extends Vue {
  private selectDataset(value: PeptideContainer) {
    console.log("Dataset selected!");
    // @ts-ignore
    this.$store.dispatch("selectDataset", value);
  }

  private deselectDataset(value: PeptideContainer) {
    // @ts-ignore
    this.$store.dispatch("deselectDataset", value);
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
