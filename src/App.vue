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
import { Titlebar, Color } from 'custom-electron-titlebar'
import Utils from "./logic/Utils";

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
  private titleBar: Titlebar = null;

  mounted() {
    // Connect with the electron-renderer thread and listen to navigation events that take place. All navigation should
    // pass through the Vue app.
    ipcRenderer.on('navigate', (sender, location) => {
      if (location !== this.$route.path) {
          this.rightNavMini = true;
          console.log("Set right nav: " + this.rightNavMini);
          this.$router.push(location);
      }
    })

    if (Utils.isWindows() && this.titleBar == null) {
      this.titleBar = new Titlebar({
        icon: require("./assets/icon.svg"),
        backgroundColor: Color.fromHex('#004ba0')
      });
    }
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
