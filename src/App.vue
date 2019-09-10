<template>
  <div id="app">
    <v-app>
      <v-container>
        <v-row>
          <v-col>
            <select-datasets-card style="min-height: 100%;" :selected-datasets="selectedDatasets"></select-datasets-card>
          </v-col>
          <v-col>
            <load-datasets-card style="min-height: 100%;" :stored-datasets="storedDatasets"></load-datasets-card>
          </v-col>
        </v-row>
      </v-container>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';
import PeptideContainer from 'unipept-web-components/logic/data-management/PeptideContainer';

@Component({
  components: {
    HelloWorld,
  }
})
export default class App extends Vue {
  private selectedDatasets: PeptideContainer[] = [];
  private storedDatasets: PeptideContainer[] = [];

}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
