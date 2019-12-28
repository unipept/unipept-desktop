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
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import PeptideContainer from "unipept-web-components/src/logic/data-management/PeptideContainer";
import Toolbar from "./components/navigation-drawers/Toolbar.vue";
import { Titlebar, Color } from "custom-electron-titlebar"
import Utils from "./logic/Utils";
import ConfigurationManager from "./logic/configuration/ConfigurationManager";
import Configuration from "./logic/configuration/Configuration";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";

const electron = window.require("electron");
const ipcRenderer  = electron.ipcRenderer;
const BrowserWindow = electron.BrowserWindow;

@Component({
    components: {
        Toolbar
    },
    computed: {
        baseUrl: {
            get(): string {
                return this.$store.getters.baseUrl;
            }
        },
        useNativeTitlebar: {
            get(): boolean {
                return this.$store.getters.useNativeTitlebar;
            }
        },
        assaysInProgress: {
            get(): Assay[] {
                return this.$store.getters.selectedDatasets.filter((assay: Assay) => assay.progress < 1);
            }
        }
    }
})
export default class App extends Vue {
  private navDrawer: boolean = false;
  private rightNavDrawer: boolean = true;
  private rightNavMini: boolean = true;
  private titleBar: Titlebar = null;
  private loading: boolean = true;

  private toolbarWidth: number = 210;
  // Has this component been initialized before?
  private static previouslyInitialized: boolean = false;

  async mounted() {
      // Connect with the electron-renderer thread and listen to navigation events that take place. All navigation should
      // pass through the Vue app.
      ipcRenderer.on("navigate", (sender, location) => {
          if (location !== this.$route.path) {
              this.rightNavMini = true;
              this.$router.push(location);
          }
      });    

      await this.initConfiguration();
      await this.setUpTitlebar();
  }

  @Watch("assaysInProgress")
  private assaysInProgressChanged(assays: Assay[]) {
      if (!assays || assays.length === 0) {
          electron.remote.BrowserWindow.getAllWindows()[0].setProgressBar(-1);
      } else {
          const average: number = assays.reduce((prev: number, currentAssay: Assay) => prev += currentAssay.progress, 0) / assays.length;
          electron.remote.BrowserWindow.getAllWindows()[0].setProgressBar(average);
      }
  }

  @Watch("useNativeTitlebar")
  private setUpTitlebar() {
      if (Utils.isWindows() && !App.previouslyInitialized && this.titleBar == null && !this.$store.getters.useNativeTitlebar) {
          this.titleBar = new Titlebar({
              icon: require("./assets/icon.svg"),
              backgroundColor: Color.fromHex("#004ba0")
          });

          document.getElementsByName("html")[0].style.overflowY = "hidden";
      }
      App.previouslyInitialized = true;
  }

  /** 
   * Read the current application configuration from disk and set up all corresponding values in the configuration
   * store.
   */
  private async initConfiguration() {
      this.loading = true;
      let configurationManager = new ConfigurationManager();
      try {
          let config: Configuration = await configurationManager.readConfiguration();
          this.$store.dispatch("setBaseUrl", config.apiSource);
          this.$store.dispatch("setUseNativeTitlebar", config.useNativeTitlebar);
      } catch (err) {
          console.error(err)
      }
   
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

  @Watch("useNativeTitlebar")
  private async onUseNativeTitlebarChanged(newValue: boolean) {
      let configurationManager = new ConfigurationManager();
      // Read the previous configuration.
      let currentConfig = await configurationManager.readConfiguration();
      // Make requested changes to the previous configuration.
      currentConfig.useNativeTitlebar = newValue;
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
    transition: initial !important;
  }

  .titlebar {
    position: fixed !important;
  }

  .titlebar, .titlebar > * {
    font-family: Roboto, sans-serif;
  }

  .container-after-titlebar .v-app-bar {
    margin-top: 30px !important;
  }

  .container-after-titlebar .v-navigation-drawer {
    top: 30px !important;
  }

  .container-after-titlebar {
    top: 0 !important;
    position: static !important;
    margin-top: 30px !important;
  }
</style>
