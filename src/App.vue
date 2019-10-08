<template>
  <div id="app" style="min-height: 100vh;">
    <v-app style="min-height: 100%;">
      <v-navigation-drawer app :mini-variant.sync="miniNavDrawer" v-model="navDrawer" class="nav-drawer">
        <v-list-item>
          <v-list-item-avatar>
            <v-img src="https://upload.wikimedia.org/wikipedia/commons/f/fb/Unipept_logo.png"></v-img>
          </v-list-item-avatar>
          <v-list-item-title>Unipept Desktop</v-list-item-title>
          <v-btn icon @click.stop="miniNavDrawer = !miniNavDrawer">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
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

      <v-app-bar app dark color="primary">
        <v-btn icon @click.stop="navDrawer = !navDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-toolbar-title>{{ $route.meta.title }}</v-toolbar-title>
      </v-app-bar>
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
import PeptideContainer from 'unipept-web-components/src/logic/data-management/PeptideContainer';

@Component({
  components: {}
})
export default class App extends Vue {
  private navDrawer: boolean = false;
  private miniNavDrawer: boolean = true;

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
</style>
