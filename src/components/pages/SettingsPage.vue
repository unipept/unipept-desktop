<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <div style="max-width: 1200px; margin: auto;">
          <h2 class="mx-auto">Connection settings</h2>
          <v-card>
            <v-card-text>
              <v-container fluid>
                <v-row>
                  <v-col cols="8">
                    <div class="settings-title">Unipept API</div>
                    <span class="settings-text">Denotes the base URL that should be used for communication with a Unipept API.</span>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field label="https://unipept.ugent.be" single-line filled v-model="apiSource" :rules="apiSourceRules"></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Configuration from './../../logic/configuration/Configuration';
import ConfigurationManager from './../../logic/configuration/ConfigurationManager';
import { Prop, Watch } from 'vue-property-decorator';
import Rules from "./../validation/Rules";

@Component
export default class SettingsPage extends Vue {
    private configuration: Configuration;

    private apiSource: string = "";

    private apiSourceRules: ((x: string) => boolean | string)[] = [
      Rules.required,
      Rules.url
    ];

    private async mounted() {
        let manager: ConfigurationManager = new ConfigurationManager();
        let config: Configuration = await manager.readConfiguration();
        this.apiSource = config.apiSource;
    }

    @Watch('apiSource')
    private saveChanges(): void {

    }
}
</script>

<style lang="less">
  .settings-title {
    color: black;
    font-size: 18px;
  }
</style>