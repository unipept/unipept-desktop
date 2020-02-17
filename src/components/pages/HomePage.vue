<template>
    <div class="homepage-container">
        <v-container fluid>
            <v-row>
                <v-col>
                    <recent-projects v-on:open-project="onOpenProject"></recent-projects>
                </v-col>
                <v-divider vertical></v-divider>
                <v-col>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <img src="@/assets/logo.svg" style="max-width: 200px;"/>
                        <span class="logo-headline">Unipept Desktop</span>
                        <span class="logo-subline">Version 0.0.1</span>

                        <div class="project-actions">
                            <div @click="createProject()">
                                <v-icon>mdi-folder-plus-outline</v-icon>
                                <span>Create new project</span>
                            </div>
                            <div>
                                <v-icon>mdi-folder-download-outline</v-icon>
                                <span>Import project</span>
                            </div>
                        </div>
                    </div>
                </v-col>
            </v-row>
            <v-snackbar v-model="errorSnackbarVisible" bottom :timeout="0" color="error">
                {{ errorMessage }}
                <v-btn dark text @click="errorSnackbarVisible = false">Close</v-btn>
            </v-snackbar>
        </v-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Project from "@/logic/project/Project";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import RecentProjects from "./../project/RecentProjects.vue";
import ProjectManager from "@/logic/project/ProjectManager";
import fs from "fs";
import ErrorInformationListener from "@/logic/error/ErrorInformationListener";
import ErrorInformation from "@/logic/error/ErrorInformation";
const { dialog } = require("electron").remote;

@Component({
    components: {
        RecentProjects
    }
})
export default class HomePage extends Vue implements ErrorInformationListener {
    private errorMessage: string = "";
    private errorSnackbarVisible: boolean = false;

    public async handleErrorInformation(error: ErrorInformation) {
        this.showError(error.message);
    }

    private async createProject() {
        const chosenPath: string | undefined = dialog.showOpenDialogSync({
            properties: ["openDirectory"]
        });
        if (chosenPath) {
            if (!await this.isDirectoryEmpty(chosenPath[0])) {
                this.showError("Chosen directory is not empty! New projects require an empty directory.");
                return;
            }

            try {
                const project: Project = new Project(chosenPath[0]);
                await project.initialize();
                await this.$store.dispatch("setProject", project);
                await this.$router.push("/analysis/single");
            } catch (err) {
                if (err instanceof IOException) {
                    this.showError(
                        "Could not initialize your project. Please make sure that the chosen directory is readable and try again."
                    );
                }
            }
        }
    }

    private async onOpenProject(path: string) {
        try {
            const projectManager: ProjectManager = new ProjectManager();
            const project: Project = await projectManager.loadExistingProject(path);
            await project.initialize();
            await this.$store.dispatch("setProject", project);
            await this.$router.push("/analysis/single");
        } catch (err) {
            if (err instanceof IOException) {
                this.showError(
                    "Could not open your project. Please make sure that the chosen directory is readable and try again."
                );
            }
        }
    }

    private showError(message: string) {
        this.errorMessage = message;
        this.errorSnackbarVisible = true;
    }

    private async isDirectoryEmpty(path: string): Promise<boolean> {
        const items: string[] = fs.readdirSync(path);
        return !items || items.length === 0;
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
