<template>
  <v-container fluid v-if="this.configuration">
    <v-form ref="form">
      <v-alert v-if="errorVisible" type="error">
        An error occurred: {{ errorMessage }}
      </v-alert>
      <v-row>
        <v-col>
          <div style="max-width: 1200px; margin: auto;">
            <h2 class="mx-auto settings-category-title">Connection settings</h2>
            <v-card>
              <v-card-text>
                <v-container fluid>
                  <v-row>
                    <v-col cols="8">
                      <div class="settings-title">Unipept API</div>
                      <span class="settings-text">Denotes the base URL that should be used for communication with a Unipept API.</span>
                    </v-col>
                    <v-col cols="4">
                      <v-text-field label="https://unipept.ugent.be" single-line filled v-model="configuration.apiSource" :rules="apiSourceRules"></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
            <h2 class="mx-auto settings-category-title">Appearance</h2>
            <v-card>
              <v-card-text>
                <v-container fluid>
                  <v-row>
                    <v-col cols="11">
                      <div class="settings-title">Use native titlebar</div>
                      <span class="settings-text">Forces the application to use the native titlebar on Windows.</span>
                      <span class="settings-text settings-important-text">Changing this option requires you to restart the application.</span>
                    </v-col>
                    <v-col cols="1">
                      <v-switch :disabled="!isWindows" v-model="configuration.useNativeTitlebar"></v-switch>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
  <v-container v-else>
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Configuration from "./../../logic/configuration/Configuration";
import ConfigurationManager from "./../../logic/configuration/ConfigurationManager";
import { Prop, Watch } from "vue-property-decorator";
import Rules from "./../validation/Rules";
import VForm from "vuetify";
import Utils from "@/logic/Utils";

@Component
export default class SettingsPage extends Vue {
    $refs!: {
      form: any;
    }

    private configuration: Configuration = null;

    private errorVisible: boolean = false;
    private errorMessage: string = "";

    private validInputs: boolean = true;
    private isWindows: boolean = Utils.isWindows();

    private apiSourceRules: ((x: string) => boolean | string)[] = [
        Rules.required,
        Rules.url
    ];

    private mounted() {
        let configManager: ConfigurationManager = new ConfigurationManager();
        configManager.readConfiguration().then((result) => this.configuration = result);
    }

    @Watch("configuration.apiSource")
    @Watch("configuration.useNativeTitlebar")
    private async saveChanges(): Promise<void> {
        this.updateStore("setBaseUrl", this.configuration.apiSource);
        this.updateStore("setUseNativeTitlebar", this.configuration.useNativeTitlebar);
    }

    private async updateStore(method, value) {
        this.errorVisible = false;
        if (this.configuration != null && this.$refs.form && this.$refs.form.validate()) {
            try {
                this.$store.dispatch(method, value);
            } catch (err) {
                if (err == "InvalidConfigurationException") {
                    this.showError("You've provided an invalid configuration. Please correct any errors and try again.");
                } else if (err == "IOException") {
                    this.showError(
                        "An error occurred while writing changes to the configuration. Check your disk and try again."
                    );
                }
            }
        }
    }

    private showError(message: string): void {
        this.errorVisible = true;
        this.errorMessage = message;
    }
}
</script>

<style lang="less">
  .settings-title {
    color: black;
    font-size: 18px;
  }

  .settings-important-text {
    font-style: italic;
    font-weight: bold;
  }

  .settings-category-title:not(:first-child) {
    margin-top: 32px;
  }

  .v-progress-circular--indeterminate {
    position: relative;
    left: 50%;
    transform: translateX(-50%);
  }
</style>