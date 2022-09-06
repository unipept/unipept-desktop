<template>
    <div id="app" style="min-height: 100vh;">
        <v-app style="min-height: 100%;" v-if="!loading">
            <v-app-bar app dark color="primary" style="z-index: 10;" :elevation="0">
                <v-toolbar-title v-if="$store.getters.projectLocation">
                    {{ $store.getters.projectName }} - {{ $route.meta.title }}
                </v-toolbar-title>
                <v-toolbar-title v-else>{{ $route.meta.title }}</v-toolbar-title>
            </v-app-bar>

            <!-- Navigation drawer for managing the currently selected peptides / experiments / etc. Is positioned on
                 the left side -->
            <Toolbar
                v-on:update:toolbar-width="onToolbarWidthUpdated">
            </Toolbar>

            <v-main
                :style="{
                    'min-height': '100%',
                    'max-width': isMini ? 'calc(100% - 55px)' : 'calc(100% - ' + (toolbarWidth + 55) + 'px)',
                    'position': 'relative',
                    'left': isMini ? '55px' : (toolbarWidth + 55) + 'px'
                }"
                class="main-container">
                <router-view style="min-height: 100%;"></router-view>
                <v-dialog v-model="errorDialog" persistent max-width="600">
                    <v-card>
                        <v-card-title>Synchronization error</v-card-title>
                        <v-card-text>
                            Could not synchronize your latest changes with the local disk. Please restart the
                            application if the problem persists.
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="error" text @click="closeApplication">Exit application</v-btn>
                            <v-btn color="primary" text @click="errorDialog = false">Ignore</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
                <!-- Snackbar that's shown while the update to the application is running -->
                <div class="updating-snackbar-container">
                    <v-snackbar v-model="updatingSnackbar" color="info" :timeout="-1">
                        <div class="updating-snackbar-content">
                            <v-progress-linear color="white" :value="updatingProgress"></v-progress-linear>
                            <div class="updating-snackbar-text">
                                Installing new version of Unipept Desktop.
                            </div>
                        </div>
                    </v-snackbar>
                </div>
                <!-- Snackbar that's shown after the application has successfully been updated -->
                <div class="updated-snackbar-container">
                    <v-snackbar v-model="updatedSnackbar" :color="updatedColor" :timeout="-1">
                        <div>
                            {{ updateMessage }}
                            <v-btn text dark @click="updatedSnackbar = false">Dismiss</v-btn>
                            <v-btn text dark @click="closeApplication">Exit app</v-btn>
                        </div>
                    </v-snackbar>
                </div>
            </v-main>
        </v-app>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Toolbar from "./components/navigation-drawers/Toolbar.vue";
import ConfigurationManager from "./logic/configuration/ConfigurationManager";
import Configuration from "./logic/configuration/Configuration";
import ErrorListener from "@/logic/filesystem/ErrorListener";
import {
    Assay,
    ProteomicsAssay,
    NetworkConfiguration,
    QueueManager,
    AssayAnalysisStatus
} from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import BootstrapApplication from "@/logic/application/BootstrapApplication";

const { app, BrowserWindow } = require("@electron/remote");
const electron = require("electron");
const ipcRenderer = electron.ipcRenderer;

@Component({
    components: {
        Toolbar
    },
    computed: {
        useNativeTitlebar: {
            get(): boolean {
                return this.$store.getters.useNativeTitlebar;
            }
        },
        activeAssay: {
            get(): AssayAnalysisStatus {
                return this.$store.getters.activeAssay;
            }
        },
        isMini: {
            get(): boolean {
                return ! ["/analysis/single", "/analysis/multi"].includes(this.$route.path);
            }
        }
    }
})
export default class App extends Vue implements ErrorListener {
    private navDrawer = false;
    private loading = true;

    private updatingSnackbar = false;
    private updatingProgress = 0;

    private updatedSnackbar = false;
    private updateMessage = "";
    private updatedColor = "info";

    private toolbarWidth = 210;

    // Has this component been initialized before?
    private static previouslyInitialized = false;

    private showHomePageDialog = true;
    private errorDialog = false;

    async mounted() {
        // Connect with the electron-renderer thread and listen to navigation events that take place. All navigation
        // should pass through the Vue app.
        ipcRenderer.on("navigate", (sender, location) => {
            if (location !== this.$route.path) {
                this.$router.push(location);
            }
        });

        ipcRenderer.on("update-available", () => {
            this.updatingSnackbar = true;
        });

        ipcRenderer.on("update-downloaded", () => {
            this.updatingSnackbar = false;
            this.updateMessage = "Update completed. Restart the application to finish the installation."
            this.updatedColor = "info";
            this.updatedSnackbar = true;
        });

        ipcRenderer.on("download-progress", (sender, value) => {
            this.updatingProgress = value;
        });

        ipcRenderer.on("update-error", (sender, err) => {
            console.error(err);
            this.updatingSnackbar = false;
            this.updateMessage = "An error occurred while updating the application. Please try again later."
            this.updatedColor = "error";
            this.updatedSnackbar = true;
        })

        await this.initConfiguration();
    }

    public handleError(err: Error) {
        console.error(err);
        this.errorDialog = true;
    }

    @Watch("activeAssay")
    private activeAssayChanged(assay: AssayAnalysisStatus) {
        if (assay.analysisReady) {
            BrowserWindow.getAllWindows()[0].setProgressBar(-1);
        } else {
            BrowserWindow.getAllWindows()[0].setProgressBar(
                this.$store.getters.activeAssay.originalProgress.currentValue
            );
        }
    }

    /**
     * Read the current application configuration from disk and set up all corresponding values in the configuration
     * store.
     */
    private async initConfiguration() {
        this.loading = true;
        try {
            const appBootstrap = new BootstrapApplication(this.$store);
            appBootstrap.loadApplicationComponents();
        } catch (err) {
            // TODO: show a proper error message to the user in case this happens
            console.error(err)
        }
        this.loading = false;
    }

    private async closeApplication() {
        app.quit();
    }

    private onToolbarWidthUpdated(newValue: number) {
        this.toolbarWidth = newValue;
    }
}
</script>

<style lang="less">
@import "~unipept-web-components/dist/unipept-web-components.css";
@import "~@mdi/font/css/materialdesignicons.min.css";


#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
}

a {
    text-decoration: none;
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

html {
    overflow-y: auto !important;
}

.updating-snackbar-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;
    align-self: start;
}

.updating-snackbar-content .updating-snackbar-text {
    margin-top: 10px;
}

.updating-snackbar-container .v-snack__content {
    padding: 0;
}

.updating-snackbar-container .v-snack__wrapper {
    display: block;
}

.updated-snackbar-container .v-snack__wrapper {
    max-width: none;
}

.v-content__wrap .container--fluid {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}

.v-progress-circular__overlay {
    transition: none !important;
}

.tip {
    font-family: "Roboto", sans-serif;
}

.main-container {
    transition: none !important;
}

</style>
