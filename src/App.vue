<template>
  <div id="app" style="min-height: 100vh;">
    <v-app style="min-height: 100%;">
      <v-app-bar app dark color="primary" style="z-index: 10;" :elevation="0">
        <v-btn icon @click.stop="navDrawer = !navDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-toolbar-title>{{ $route.meta.title }}</v-toolbar-title>
      </v-app-bar>

      <!-- Navigation drawer for managing the currently selected peptides / experiments / etc. Is positioned on the 
           right side -->
      <SampleManager :open.sync="rightNavDrawer" :mini.sync="rightNavMini" v-on:activate-dataset="onActivateDataset"></SampleManager>

      <v-content style="min-height: 100%; max-width: calc(100% - 80px); position: relative; left: 80px;" :class="{'open-right-nav-drawer': !rightNavMini}">
        <router-view style="min-height: 100%;"></router-view>
      </v-content>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import PeptideContainer from 'unipept-web-components/src/logic/data-management/PeptideContainer';
import Toolbar from './components/navigation-drawers/Toolbar.vue';
import SampleManager from './components/sample/SampleManager.vue';

const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;

@Component({
  components: {
    Toolbar,
    SampleManager
  }
})
export default class App extends Vue {
  private navDrawer: boolean = false;
  private rightNavDrawer: boolean = true;
  private rightNavMini: boolean = true;

  mounted() {
    // Connect with the electron-renderer thread and listen to navigation events that take place. All navigation should
    // pass through the Vue app.
    ipcRenderer.on('navigate', (sender, location) => {
      if (location !== this.$route.path) {
        this.$router.push(location);
      }
    })
  }

  private selectDataset(value: PeptideContainer) {
    // @ts-ignore
    this.$store.dispatch("selectDataset", value);
  }

  private deselectDataset(value: PeptideContainer) {
    // @ts-ignore
    this.$store.dispatch("deselectDataset", value);
  }

  private onActivateDataset(value: PeptideContainer) {
    this.$store.dispatch("setActiveDataset", value);
  }
}
</script>

<style lang="less">
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

  .nav-drawer .v-divider {
    margin-top: 7px !important;
  }

  .open-right-nav-drawer {
    max-width: calc(100% - 290px) !important;
    position: relative;
    left: 290px !important;
  }
</style>
