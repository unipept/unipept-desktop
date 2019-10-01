<template>
  <div id="app" style="min-height: 100vh;">
    <v-app style="min-height: 100%;">
      <v-navigation-drawer :mini-variant="true" permanent>
        <v-list-item>
          <v-list-item-avatar>
            <v-img src="https://upload.wikimedia.org/wikipedia/commons/f/fb/Unipept_logo.png"></v-img>
          </v-list-item-avatar>
          <v-list-item-title>Unipept</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item link to='/'>
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item link to='/settings'>
            <v-list-item-icon>
              <v-icon>mdi-settings</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
      <v-content style="min-height: 100%;">
        <router-view style="min-height: 100%;"></router-view>
      </v-content>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import PeptideContainer from 'unipept-web-components/logic/data-management/PeptideContainer';

@Component({
  components: {}
})
export default class App extends Vue {
  private selectDataset(value: PeptideContainer) {
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

  .v-application--wrap {
    flex-direction: row !important;
  }
</style>
