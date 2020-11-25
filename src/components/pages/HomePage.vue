<template>
    <div class="homepage-container">
        <v-container fluid>
            <v-row v-if="loadingProject || loadingApplication">
                <v-col :cols="12" class="d-flex justify-center align-center flex-column">
                    <v-progress-circular :size="70" :width="7" color="primary" indeterminate>
                    </v-progress-circular>
                    <span v-if="loadingProject">Please stand by while we're loading your project...</span>
                    <span v-if="loadingApplication">Please stand by while we're loading the application...</span>
                </v-col>
            </v-row>
            <v-row v-else>
                <v-col>
                    <recent-projects v-on:open-project="onOpenProject"></recent-projects>
                </v-col>
                <v-divider vertical></v-divider>
                <v-col>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <img src="@/assets/logo.png" style="max-width: 200px;"/>
                        <span class="logo-headline">
                            Unipept Desktop
                        </span>
                        <span class="logo-subline">
                            Version {{ version }}
                            <a @click="releaseNotesActive = true">(What's new?)</a>
                        </span>
                        <span v-if="updateAvailable" class="logo-subline" @click="updateNotesActive = true">
                            <v-icon style="position: relative; bottom: 2px;" color="success">mdi-arrow-up-bold</v-icon>
                            <a>An update is available!</a>
                        </span>
                        <div class="project-actions">
                            <tooltip message="Select an empty folder and create a new project." position="bottom">
                                <div @click="createProject()">
                                    <v-icon large>mdi-folder-plus-outline</v-icon>
                                    <span style="font-size: 24px;">Create new project</span>
                                </div>
                            </tooltip>
                            <tooltip message="Import a project from an external model." position="bottom">
                                <div>
                                    <v-icon large>mdi-folder-download-outline</v-icon>
                                    <span style="font-size: 24px;">Import project</span>
                                </div>
                            </tooltip>
                        </div>
                    </div>

                    <div class="d-flex justify-center mt-12">
                        <v-card>
                            <v-card-title>
                                New here? Try our demo project!
                            </v-card-title>
                            <v-card-text style="max-width: 400px;">
                                If this is the first time you're using our application, we advise you to open the
                                demo project and discover what this application can do for you.
                                <div class="text-center mt-2">
                                    <v-btn color="primary" @click="openDemoProject">Open demo project</v-btn>
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-col>
            </v-row>
            <v-snackbar v-model="errorSnackbarVisible" bottom :timeout="-1" color="error">
                {{ errorMessage }}
                <v-btn dark text @click="errorSnackbarVisible = false">Dismiss</v-btn>
            </v-snackbar>
            <v-dialog persistent v-model="downloadingDatabase" max-width="600px">
                <v-card>
                    <v-card-title>
                        Updating static database
                    </v-card-title>
                    <v-card-text>
                        This application requires a database with static information to operate correctly. This database
                        is not present or outdated and needs to be retrieved from our servers. Please stand by while
                        we're processing this download.
                        <v-progress-linear :value="downloadDatabaseProgress" class="mt-4"></v-progress-linear>
                        <div style="text-align: center;">{{ downloadDatabaseProgress }}%</div>
                    </v-card-text>
                </v-card>
            </v-dialog>
            <release-notes-dialog v-model="releaseNotesActive"></release-notes-dialog>
            <update-notes-dialog v-model="updateNotesActive"></update-notes-dialog>
        </v-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import RecentProjects from "./../project/RecentProjects.vue";
import ProjectManager from "@/logic/filesystem/project/ProjectManager";
import fs from "fs";
import InvalidProjectException from "@/logic/filesystem/project/InvalidProjectException";
import { Tooltip } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import DemoProjectManager from "@/logic/filesystem/project/DemoProjectManager";
import ProjectVersionMismatchException from "@/logic/exception/ProjectVersionMismatchException";
import ReleaseNotesDialog from "@/components/dialogs/ReleaseNotesDialog.vue";
import UpdateNotesDialog from "@/components/dialogs/UpdateNotesDialog.vue";
import GitHubCommunicator from "@/logic/communication/github/GitHubCommunicator";
import Utils from "@/logic/Utils";
import { OpenDialogOptions } from "electron";

const electron = require("electron");
const { dialog } = electron.remote;
const app = electron.remote.app;

@Component({
    components: {
        UpdateNotesDialog,
        ReleaseNotesDialog,
        RecentProjects,
        Tooltip
    }
})
export default class HomePage extends Vue {
    private errorMessage: string = "";
    private errorSnackbarVisible: boolean = false;
    private version: string = "";
    private loadingApplication: boolean = false;
    private loadingProject: boolean = false;
    // Is the release notes dialog visible? (shows changes introduced in the current version of the app)
    private releaseNotesActive: boolean = false;
    // Is the update notes dialog visible? (shows the changes between this version and the most recent one)
    private updateNotesActive: boolean = false;
    // Is there an update for the application available?
    private updateAvailable: boolean = false;

    // Whether we're currently downloading the static information database (user interaction should be blocked during
    // this event).
    private downloadingDatabase: boolean = false;
    private downloadDatabaseProgress: number = 0;

    private static downloadCheckPerformed: boolean = false;

    async mounted() {
        this.loadingApplication = true;
        let shouldUpdate: boolean = false;

        this.version = app.getVersion();

        // Only check if we need to update the database once (at start of application).
        if (!HomePage.downloadCheckPerformed) {
            HomePage.downloadCheckPerformed = true;
            shouldUpdate = await this.checkStaticDatabaseUpdate();

            const githubCommunicator = new GitHubCommunicator();
            this.updateAvailable = Utils.isVersionLargerThan(
                await githubCommunicator.getMostRecentVersion(),
                this.version
            );
        }

        this.loadingApplication = false;
        if (shouldUpdate) {
            this.downloadingDatabase = true;
            await this.updateStaticDatabase();
            this.downloadingDatabase = false;
        }

    }

    private async checkStaticDatabaseUpdate(): Promise<boolean> {
        try {
            const staticDbManager = new StaticDatabaseManager();
            return await staticDbManager.requiresUpdate();
        } catch (err) {
            console.warn(err);
            this.showError(
                "Could not check if required files need to be updated. Please check your internet connection and retry. " +
                "The application will work without these files, but will be slower or less accurate than usual."
            );
        }
    }

    private async updateStaticDatabase(): Promise<void> {
        try {
            const staticDbManager = new StaticDatabaseManager();
            return await staticDbManager.updateDatabase({
                onProgressUpdate: (progress: number): void => {
                    this.downloadDatabaseProgress = Math.ceil(progress * 100);
                }
            });
        } catch (err) {
            console.warn(err);
            this.showError(
                "An error occurred while trying to update or install required files. The application will work " +
                "without these files, but will be slower or less accurate than usual."
            );
        }
    }

    private async createProject() {
        const chosenPath: string[] | undefined = await dialog.showOpenDialogSync({
            properties: ["openDirectory", "createDirectory"]
        });

        if (chosenPath) {
            if (!await this.isDirectoryEmpty(chosenPath[0])) {
                this.showError("Chosen directory is not empty! New projects require an empty directory.");
                return;
            }

            await this.initializeProject(chosenPath[0]);
        }
    }

    private async initializeProject(path: string, addToRecents: boolean = true) {
        try {
            const projectManager: ProjectManager = new ProjectManager();
            await projectManager.initializeProject(path, addToRecents);
            await this.$router.push("/analysis/single");
        } catch (err) {
            console.error(err);
            this.showError(
                "Could not initialize your project. Please make sure that the chosen directory is writeable and " +
                "try again."
            );
        }
    }

    private async onOpenProject(path: string, addToRecents: boolean = true) {
        this.loadingProject = true;
        try {
            if (!this.$store.getters.projectLocation || this.$store.getters.projectLocation !== path) {
                const projectManager: ProjectManager = new ProjectManager();
                await projectManager.loadExistingProject(path, addToRecents);
            }
            await this.$router.push("/analysis/single");
        } catch (err) {
            if (err instanceof InvalidProjectException) {
                this.showError("This is not a valid Unipept project. Maybe you want to create a new project?");
            } else if (err instanceof ProjectVersionMismatchException) {
                this.showError(
                    "This project was made with a newer version of the Unipept Desktop application. " +
                    "Please update the application to continue."
                );
            } else {
                console.error(err);
                this.showError(
                    "Could not open your project. Please make sure that the chosen directory is writeable and try " +
                    "again."
                );
            }
        }
        this.loadingProject = false;
    }

    private async openDemoProject() {
        this.loadingProject = true;
        const demoManager = new DemoProjectManager();
        const demoPath = await demoManager.initializeDemoProject();
        await this.onOpenProject(demoPath, false);
        this.loadingProject = false;
    }

    private showError(message: string) {
        this.errorMessage = message;
        this.errorSnackbarVisible = true;
    }

    private async isDirectoryEmpty(path: string): Promise<boolean> {
        const items = fs.readdirSync(path);
        return !items || items.filter(entry => !entry.startsWith(".")).length === 0;
    }
}
</script>

<style>
    .logo-headline {
        margin-top: 8px;
        font-size: 24px;
        color: black;
    }

    .logo-subline {
        font-size: 16px;
        color: #777;
    }

    .project-actions {
        display: flex;
        flex-direction: column;
        margin-top: 16px;
    }

    .project-actions div {
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .project-actions span {
        font-size: 18px;
        margin-left: 8px;
    }

    .project-actions .v-icon {
        position: relative;
        top: -2px;
    }

    .homepage-container, .homepage-container .container {
        display: flex;
    }
</style>
