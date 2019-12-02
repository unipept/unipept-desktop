<template>
  <div id="app" style="min-height: 100vh;">
    <v-app style="min-height: 100%;" v-if="!loading">
      <v-app-bar app dark color="primary" style="z-index: 10;" :elevation="0">
        <v-btn icon @click.stop="navDrawer = !navDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-toolbar-title>{{ $route.meta.title }}</v-toolbar-title>
      </v-app-bar>

      <!-- Navigation drawer for managing the currently selected peptides / experiments / etc. Is positioned on the 
           right side -->
      <Toolbar 
        :open.sync="rightNavDrawer" 
        :mini.sync="rightNavMini" 
        v-on:activate-dataset="onActivateDataset" 
        v-on:update:toolbar-width="onToolbarWidthUpdated">
      </Toolbar>

      <v-content 
        :style="{
          'min-height': '100%',
          'max-width': rightNavMini ? 'calc(100% - 80px)' : 'calc(100% - ' + (toolbarWidth + 80) + 'px)',
          'position': 'relative',
          'left': rightNavMini ? '80px' : (toolbarWidth + 80) + 'px'
        }">
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
import ConfigurationManager from './logic/configuration/ConfigurationManager';
import Configuration from './logic/configuration/Configuration';

const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;

@Component({
  components: {
    Toolbar
  },
  computed: {
    baseUrl: {
      get(): string {
        return this.$store.getters.baseUrl;
      }
    }
  }
})
export default class App extends Vue {
  private navDrawer: boolean = false;
  private rightNavDrawer: boolean = true;
  private rightNavMini: boolean = true;
  private loading: boolean = true;

  private toolbarWidth: number = 210;

  async mounted() {
    // Connect with the electron-renderer thread and listen to navigation events that take place. All navigation should
    // pass through the Vue app.
    ipcRenderer.on('navigate', (sender, location) => {
      if (location !== this.$route.path) {
          this.rightNavMini = true;
          this.$router.push(location);
      }
    });

    await this.initConfiguration();
  }

  /** 
   * Read the current application configuration from disk and set up all corresponding values in the configuration
   * store.
   */
  private async initConfiguration() {
    this.loading = true;
    let configurationManager = new ConfigurationManager();
    let config: Configuration = await configurationManager.readConfiguration();
    this.$store.dispatch('setBaseUrl', config.apiSource);
    this.loading = false;
  }

  private onToolbarWidthUpdated(newValue: number) {
    this.toolbarWidth = newValue;
  }

  @Watch("baseUrl")
  private async onBaseUrlChanged(newUrl: string) {
    let configurationManager = new ConfigurationManager();
    // Read the previous configuration.
    let currentConfig = await configurationManager.readConfiguration();
    // Make requested changes to the previous configuration.
    currentConfig.apiSource = newUrl;
    // Write changes to disk.
    await configurationManager.writeConfiguration(currentConfig);
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
  
  .v-content {
    // Force right part of the application to resize immediately
    transition: initial;
  }
</style>
