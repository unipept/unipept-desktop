<template>
  <div id="app" style="min-height: 100vh;">
    <v-app style="min-height: 100%;">
      <!-- Navigation drawer for switching between different pages (analyse, settings, etc). Is positioned on the left
           side -->
      <v-navigation-drawer app v-model="navDrawer" class="nav-drawer">
        <v-list-item>
          <v-list-item-avatar>
            <v-img src="https://upload.wikimedia.org/wikipedia/commons/f/fb/Unipept_logo.png"></v-img>
          </v-list-item-avatar>
          <v-list-item-title>Unipept Desktop</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item link to='/'>
            <v-list-item-icon>
              <v-icon>mdi-bacteria</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Analyse</v-list-item-title>
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

      <v-app-bar app dark color="primary" style="z-index: 10;" :elevation="0">
        <v-btn icon @click.stop="navDrawer = !navDrawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-toolbar-title>{{ $route.meta.title }}</v-toolbar-title>
      </v-app-bar>

      <!-- Navigation drawer for managing the currently selected peptides / experiments / etc. Is positioned on the 
           right side -->
      <v-navigation-drawer v-model="rightNavDrawer" :mini-variant.sync="rightNavMini" fixed right>
        <v-list style="position: relative; top: 64px;">
          <v-list-group prepend-icon="mdi-format-list-bulleted">
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>Samples</v-list-item-title>
              </v-list-item-content>
            </template>
            <v-list-item @click="activateDataset(dataset)" v-for="dataset of this.$store.getters.selectedDatasets" :key="dataset.id">
              <v-list-item-title>
                {{ dataset.getName() }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ dataset.getAmountOfPeptides() }} peptides
              </v-list-item-subtitle>
              <v-list-item-action v-if="dataset.progress !== 1">
                  <v-progress-circular :rotate="-90" :size="24" :value="dataset.progress * 100" color="primary"></v-progress-circular>
              </v-list-item-action>
            </v-list-item>
          </v-list-group>

          <v-list-group prepend-icon="mdi-tune">
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>Search settings</v-list-item-title>
              </v-list-item-content>
            </template>

            <v-list-item>
              <template v-slot:default="{active, toggle}">
                <v-list-item-action>
                  <v-checkbox></v-checkbox>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title>Equate I and L</v-list-item-title>
                </v-list-item-content>
              </template>
            </v-list-item>
            <v-list-item>
              <template v-slot:default="{active, toggle}">
                <v-list-item-action>
                  <v-checkbox></v-checkbox>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title>Filter duplicate peptides</v-list-item-title>
                </v-list-item-content>
              </template>
            </v-list-item>
            <v-list-item>
              <template v-slot:default="{active, toggle}">
                <v-list-item-action>
                  <v-checkbox></v-checkbox>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title>Advanced missing cleavage handling</v-list-item-title>
                </v-list-item-content>
              </template>
            </v-list-item>
          </v-list-group>
        </v-list>
        <v-btn icon @click="rightNavMini = !rightNavMini" class="drawer-chevron">
          <v-icon>{{ rightNavMini ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
        </v-btn>
      </v-navigation-drawer>

      <v-content style="min-height: 100%; max-width: calc(100% - 80px);" :class="{'open-right-nav-drawer': !rightNavMini}">
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
  private rightNavDrawer: boolean = true;
  private rightNavMini: boolean = true;

  private selectDataset(value: PeptideContainer) {
    // @ts-ignore
    this.$store.dispatch("selectDataset", value);
  }

  private deselectDataset(value: PeptideContainer) {
    // @ts-ignore
    this.$store.dispatch("deselectDataset", value);
  }

  private activateDataset(value: PeptideContainer) {
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
    max-width: calc(100% - 256px) !important;
  }

  .drawer-chevron {
    position: absolute !important;
    top: 50%;
    transform: translateY(-50%);
  }
</style>
