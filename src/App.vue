<template>
    <div id="app" style="min-height: 100vh;">
        <v-app style="min-height: 100%;" v-if="!loading">
            <v-app-bar app dark color="primary" style="z-index: 10;" :elevation="0">
                <v-btn icon @click.stop="navDrawer = !navDrawer">
                    <v-icon>mdi-menu</v-icon>
                </v-btn>
                <v-toolbar-title>{{ $route.meta.title }}</v-toolbar-title>
            </v-app-bar>

            <!-- Navigation drawer for managing the currently selected peptides / experiments / etc. Is positioned on
                 the left side -->
            <Toolbar
                :open.sync="rightNavDrawer"
                :mini.sync="rightNavMini"
                v-on:activate-dataset="onActivateDataset"
                v-on:update:toolbar-width="onToolbarWidthUpdated">
            </Toolbar>

            <v-content
                :style="{
                    'min-height': '100%',
                    'max-width': rightNavMini ? 'calc(100% - 55px)' : 'calc(100% - ' + (toolbarWidth + 55) + 'px)',
                    'position': 'relative',
                    'left': rightNavMini ? '55px' : (toolbarWidth + 55) + 'px'
                }">
                <router-view style="min-height: 100%;"></router-view>
                <v-dialog v-model="errorDialog" persistent max-width="600">
                    <v-card>
                        <v-card-title>Synchronization error</v-card-title>
                        <v-card-text>
                            Could not synchronize your latest changes with the local disk. Please retry or restart the
                            application if this problem persists.
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="error" text @click="errorDialog = false">Exit application</v-btn>
                            <v-btn color="primary" text @click="errorDialog = false">Retry</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-content>
        </v-app>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Toolbar from "./components/navigation-drawers/Toolbar.vue";
import Utils from "./logic/Utils";
import ConfigurationManager from "./logic/configuration/ConfigurationManager";
import Configuration from "./logic/configuration/Configuration";
import Project from "@/logic/filesystem/project/Project";
import ErrorListener from "@/logic/filesystem/ErrorListener";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";

const electron = window.require("electron");
const ipcRenderer = electron.ipcRenderer;
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
                if (this.$store.getters.getProject) {
                    return this.$store.getters.getProject.getAllAssays()
                        .filter((a: Assay) => this.$store.getters.getProject.getProcessingResults(a).progress < 1)
                        .reduce((acc, current) => acc.concat(current), []);
                } else {
                    return [];
                }
            }
        },
        watchableProject: {
            get(): Project {
                return this.$store.getters.getProject
            }
        }
    }
})
export default class App extends Vue implements ErrorListener {
    private navDrawer: boolean = false;
    private rightNavDrawer: boolean = true;
    private rightNavMini: boolean = true;
    private loading: boolean = true;

    private toolbarWidth: number = 210;
    // Has this component been initialized before?
    private static previouslyInitialized: boolean = false;

    private showHomePageDialog: boolean = true;
    private errorDialog: boolean = false;

    async mounted() {
        // Connect with the electron-renderer thread and listen to navigation events that take place. All navigation
        // should pass through the Vue app.
        ipcRenderer.on("navigate", (sender, location) => {
            if (location !== this.$route.path) {
                this.rightNavMini = true;
                this.$router.push(location);
            }
        });

        await this.initConfiguration();
        await this.setUpTitlebar();
    }

    public handleError(err: Error) {
        console.error(err);
        this.errorDialog = true;
    }

    @Watch("assaysInProgress")
    private assaysInProgressChanged(assays: Assay[]) {
        const project: Project = this.$store.getters.getProject;

        if (!assays || assays.length === 0) {
            electron.remote.BrowserWindow.getAllWindows()[0].setProgressBar(-1);
        } else {
            const average: number = assays.reduce(
                (prev: number, currentAssay: Assay) => prev += project.getProcessingResults(currentAssay).progress, 0
            ) / assays.length;
            electron.remote.BrowserWindow.getAllWindows()[0].setProgressBar(average);
        }
    }

    @Watch("useNativeTitlebar")
    private setUpTitlebar() {
        //   if (
        //       Utils.isWindows() &&
        //       !App.previouslyInitialized &&
        //       this.titleBar == null && !this.$store.getters.useNativeTitlebar
        //   ) {
        //       this.titleBar = new Titlebar({
        //           icon: require("./assets/icon.svg"),
        //           backgroundColor: Color.fromHex("#004ba0")
        //       });

        //   }
        //   App.previouslyInitialized = true;
    }

    @Watch("watchableProject")
    private onProjectChanged() {
        const project: Project = this.$store.getters.getProject;
        if (project) {
            project.addErrorListener(this);
        }
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
            // TODO: show a proper error message to the user in case this happens
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

    private onActivateDataset(value: ProteomicsAssay) {
        this.$store.dispatch("setActiveDataset", value);
    }
}
</script>

<style lang="less">
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
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

    html {
        overflow-y: auto !important;
    }

    .v-content__wrap .container--fluid {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
    }

    //   .container-after-titlebar .v-app-bar {
    //     margin-top: 30px !important;
    //   }

    //   .container-after-titlebar .v-navigation-drawer {
    //     top: 30px !important;
    //   }

    //   .container-after-titlebar {
    //     top: 0 !important;
    //     position: static !important;
    //     margin-top: 30px !important;
    //   }

    //   .container-after-titlebar .v-content__wrap {
    //       max-height: 100vh;
    //   }

    //   .container-after-titlebar .v-content__wrap > .container {
    //       height: 100%;
    //       overflow-y: scroll;
    //   }
</style>
