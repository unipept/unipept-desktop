<template>
    <v-container fluid v-if="this.configuration">
        <v-form ref="form" @submit.prevent>
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
                                            <span class="settings-text">
                                                Denotes the base URL that should be used for communication with a
                                                Unipept API.
                                            </span>
                                        </v-col>
                                        <v-col cols="4">
                                            <v-text-field label="https://unipept.ugent.be" single-line filled
                                                v-model="configuration.apiSource"
                                                :rules="apiSourceRules">
                                            </v-text-field>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-card-text>
                        </v-card>
                        <h2 class="mx-auto settings-category-title">Concurrency</h2>
                        <v-card>
                            <v-card-text>
                                <v-container fluid>
                                    <v-row>
                                        <v-col cols="10">
                                            <div class="settings-title">Long running tasks</div>
                                            <span class="settings-text">
                                                How many long running tasks can be computed in parallel? This setting
                                                controls the max amount of CPU cores that can be used by this
                                                application. Increasing this value leads to faster analysis, but
                                                increases both memory and CPU usage of this application.
                                            </span>
                                            <span class="settings-text settings-important-text">
                                                Changing this option requires you to restart the application.
                                            </span>
                                        </v-col>
                                        <v-col cols="2">
                                            <v-text-field
                                                label="8"
                                                single-line filled
                                                v-model="maxLongRunningTasks"
                                                type="number"
                                                :rules="maxTasksRules">
                                            </v-text-field>
                                        </v-col>
                                    </v-row>
                                    <v-row>
                                        <v-col cols="10">
                                            <div class="settings-title">API requests</div>
                                            <span class="settings-text">
                                                How many API requests can be performed in parallel? This setting
                                                controls the max amount of requests to the API server that can be
                                                performed in parallel. Increasing this value can lead to a faster
                                                analysis. Setting it too high could however cause stability issues on
                                                the server side.
                                            </span>
                                        </v-col>
                                        <v-col cols="2">
                                            <v-text-field
                                                label="5"
                                                single-line filled
                                                type="number"
                                                v-model="maxParallelRequests"
                                                :rules="maxRequestRules">
                                            </v-text-field>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-card-text>
                        </v-card>
                        <h2 class="mx-auto settings-category-title">Storage</h2>
                        <v-card>
                            <v-card-text>
                                <v-container fluid>
                                    <v-row>
                                        <v-col cols="8">
                                            <div class="settings-title">Database storage location</div>
                                            <div class="settings-text">
                                                Indicates where the application should store custom database files? Note
                                                that these files can grow quite large in size, depending on the amount
                                                and size of the custom databases you are planning to use. For large
                                                databases, at least 100GiB of free space is required.
                                            </div>
                                        </v-col>
                                        <v-col cols="4">
                                            <v-text-field
                                                single-line
                                                filled
                                                readonly
                                                v-model="customDbStorageLocation"
                                                :rules="customDbStorageLocationRules"
                                                prepend-inner-icon="mdi-folder-outline"
                                                @click="openDbStorageFileDialog">
                                            </v-text-field>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-card-text>
                        </v-card>
                        <h2 class="mx-auto settings-category-title">Docker</h2>
                        <v-card>
                            <v-card-text>
                                <v-container fluid>
                                    <v-row>
                                        <v-col cols="12">
                                            <span class="settings-text">
                                                This application requires a connection with a local Docker installation
                                                in order to provide custom protein database functionality. If you
                                                currently don't have Docker installed locally, you can download it for
                                                free from <a @click="openInBrowser('https://www.docker.com/products/docker-desktop')">the Docker website</a>.
                                                We recommend using Docker Desktop, which automatically comes with
                                                Docker Engine (which in turn is required by this application in order
                                                to allow easy communication with the Docker daemon.
                                            </span>
                                        </v-col>
                                    </v-row>
                                    <v-row>
                                        <v-col cols="12">
                                            <div class="settings-title">Connection settings</div>
                                            <span class="settings-text">
                                                Provide a valid configuration that's required to connect to your local
                                                Docker installation. All valid configuration options, that will be
                                                accepted by this application can be found
                                                <a @click="openInBrowser('https://github.com/apocas/dockerode#getting-started')">
                                                here</a>. Please note that the default settings provided by this
                                                application work in most cases, you only need to change this
                                                configuration if no connection to your local Docker installation can be
                                                made.
                                            </span>
                                        </v-col>
                                    </v-row>
                                    <v-row>
                                        <v-col cols="12">
                                            <v-textarea filled :rules="dockerConfigRules" v-model="dockerConnectionSettings" :rows="2" v-on:blur="updateDockerConnection" />
                                        </v-col>
                                    </v-row>
                                    <v-row>
                                        <v-col cols="12">
                                            <div class="settings-title">
                                                Docker availability
                                            </div>
                                            <a class="settings-text" @click="retrieveDockerInfo">
                                                Click to refresh status
                                            </a>
                                        </v-col>
                                    </v-row>
                                    <v-row>
                                        <v-col cols="12" style="min-height: 132px;">
                                            <div v-if="dockerInfoLoading" class="d-flex flex-column align-center">
                                                <v-progress-circular color="primary" indeterminate></v-progress-circular>
                                                <span>Checking connection with Docker</span>
                                            </div>
                                            <div v-else class="d-flex">
                                                <div style="max-width: 120px;" class="ml-4 mr-8">
                                                    <v-img v-if="dockerInfo" src="@/assets/images/docker/docker_available.svg"/>
                                                    <v-img v-else src="@/assets/images/docker/docker_na.svg"/>
                                                </div>
                                                <div class="settings-text" v-if="dockerInfo">
                                                    <div>
                                                        <strong>Architecture:</strong> {{ dockerInfo.Architecture }}
                                                    </div>
                                                    <div>
                                                        <strong>CPUs available:</strong> {{ dockerInfo.NCPU }}
                                                    </div>
                                                    <div>
                                                        <strong>Total memory available: </strong>
                                                        {{ dockerInfo.MemTotal }} bytes
                                                        ({{ (dockerInfo.MemTotal / (Math.pow(2,30))).toFixed(2) }} GiB)
                                                    </div>
                                                    <div>
                                                        <strong>OS type:</strong>
                                                        {{ dockerInfo.OSType }} ({{ dockerInfo.KernelVersion }})
                                                    </div>
                                                    <div>
                                                        <strong>Docker server version:</strong>
                                                        {{ dockerInfo.ServerVersion }}
                                                    </div>
                                                    <div>
                                                        <strong>ID:</strong> {{ dockerInfo.ID }}
                                                    </div>
                                                </div>
                                                <span class="settings-text" v-else>
                                                    We were unable to connect to your local Docker installation. Please
                                                    verify that Docker engine has been properly installed on your
                                                    system, that it is currently running and that the configuration
                                                    provided above is correct. Remember to check your firewall settings
                                                    if Docker seems to be running perfectly, but no connection can be
                                                    established.
                                                </span>
                                            </div>
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
    <v-container v-else class="d-flex flex-column align-center">
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
import { NetworkConfiguration, NetworkUtils } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";

@Component
export default class SettingsPage extends Vue {
    $refs!: {
        form: any;
    }

    private configuration: Configuration = null;

    private errorVisible: boolean = false;
    private errorMessage: string = "";

    private dockerInfo: any = null;
    private dockerInfoLoading: boolean = true;

    private apiSourceRules: ((x: string) => boolean | string)[] = [
        Rules.required,
        Rules.url
    ];

    private maxTasksRules: ((x: string) => boolean | string)[] = [
        Rules.required,
        Rules.integer,
        Rules.gtZero
    ];

    private maxRequestRules: ((x: string) => boolean | string)[] = [
        Rules.required,
        Rules.integer,
        Rules.gtZero,
        Rules.lteTen
    ];

    private dockerConfigRules: ((x: string) => boolean | string)[] = [
        Rules.required,
        Rules.json
    ];

    private customDbStorageLocationRules: ((x: string) => boolean | string)[] = [
        Rules.required
    ];

    private mounted() {
        let configManager: ConfigurationManager = new ConfigurationManager();
        configManager.readConfiguration().then((result) => this.configuration = result);

        this.retrieveDockerInfo();
    }

    private async beforeDestroy() {
        let configurationManager = new ConfigurationManager();
        // Write changes to disk.
        await configurationManager.writeConfiguration(this.configuration);
    }

    set maxLongRunningTasks(val: string) {
        this.configuration.maxLongRunningTasks = Number.parseInt(val);
    }

    get maxLongRunningTasks(): string {
        return this.configuration.maxLongRunningTasks.toString();
    }

    set maxParallelRequests(val: string) {
        this.configuration.maxParallelRequests = Number.parseInt(val);
    }

    get maxParallelRequests(): string {
        return this.configuration.maxParallelRequests.toString();
    }

    set dockerConnectionSettings(settings: string) {
        this.configuration.dockerConfigurationSettings = settings;
    }

    get dockerConnectionSettings(): string {
        return this.configuration.dockerConfigurationSettings;
    }

    set customDbStorageLocation(value: string) {
        this.configuration.customDbStorageLocation = value;
    }

    get customDbStorageLocation(): string {
        return this.configuration.customDbStorageLocation;
    }

    @Watch("configuration.apiSource")
    @Watch("configuration.maxLongRunningTasks")
    @Watch("configuration.maxParallelRequests")
    @Watch("configuration.dockerConnectionSettings")
    private async saveChanges(): Promise<void> {
        NetworkConfiguration.BASE_URL = this.configuration.apiSource;
        NetworkConfiguration.PARALLEL_API_REQUESTS = this.configuration.maxParallelRequests;
        // Update docker connection
    }

    private updateDockerConnection() {
        if (this.dockerConfigRules.every(rule => rule(this.configuration.dockerConfigurationSettings))) {
            DockerCommunicator.initializeConnection(JSON.parse(this.configuration.dockerConfigurationSettings));
            this.retrieveDockerInfo();
        }
    }

    private async retrieveDockerInfo() {
        this.dockerInfoLoading = true;

        const dockerCommunicator = new DockerCommunicator();

        try {
            this.dockerInfo = await dockerCommunicator.getDockerInfo();
        } catch (e) {
            this.dockerInfo = null;
        }

        this.dockerInfoLoading = false;
    }


    private async updateStore(method: string, value: any) {
        this.errorVisible = false;
        if (this.configuration != null && this.$refs.form && this.$refs.form.validate()) {
            try {
                this.$store.dispatch(method, value);
            } catch (err) {
                if (err == "InvalidConfigurationException") {
                    this.showError(
                        "You've provided an invalid configuration. Please correct any errors and try again."
                    );
                } else if (err == "IOException") {
                    this.showError(
                        "An error occurred while writing changes to the configuration. Check your disk and try again."
                    );
                }
            }
        }
    }

    private async openDbStorageFileDialog(): Promise<void> {
        const electron = require("electron");
        const { dialog } = electron.remote;

        const chosenPath: Electron.OpenDialogReturnValue | undefined = await dialog.showOpenDialog({
            properties: ["openDirectory", "createDirectory"]
        });

        if (chosenPath && chosenPath.filePaths.length > 0) {
            this.customDbStorageLocation = chosenPath.filePaths[0];
        }
    }

    private showError(message: string): void {
        this.errorVisible = true;
        this.errorMessage = message;
    }

    private openInBrowser(url: string): void {
        NetworkUtils.openInBrowser(url);
    }
}
</script>

<style lang="less" scoped>
    .settings-title {
        color: black;
        font-size: 18px;
    }

    .settings-important-text {
        font-style: italic;
        font-weight: bold;
        display: block;
    }

    .settings-category-title:not(:first-child) {
        margin-top: 32px;
    }
</style>
