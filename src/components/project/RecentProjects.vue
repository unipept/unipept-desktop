<template>
    <div class="mx-12">
        <h2>Project management</h2>

        <v-row class="mt-1 mb-6">
            <v-col md="12" lg="6">
                <v-card>
                    <v-card-title>Add project</v-card-title>
                    <v-card-text>
                        <div>Select an empty folder and create a new project.</div>
                        <div class="text-center mt-2">
                            <v-btn color="primary" @click="createProject">
                                <v-icon class="mr-2">mdi-folder-plus-outline</v-icon>
                                Create project
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col md="12" lg="6">
                <v-card>
                    <v-card-title>Load project</v-card-title>
                    <v-card-text>
                        <div>Select a previously created project to open.</div>
                        <div class="text-center mt-2">
                            <v-btn @click="openProject">
                                <v-icon class="mr-2">mdi-folder-open-outline</v-icon>
                                Select project
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <h2>Recent projects</h2>
        <div v-if="recentProjects.length > 0">
            <v-list two-line>
                <v-list-item
                    v-for="recentProject of recentProjects"
                    :key="recentProject.path"
                    @click="openPreviouslyLoadedProject(recentProject.path)">
                    <v-list-item-avatar>
                        <v-icon>mdi-folder-open-outline</v-icon>
                    </v-list-item-avatar>
                    <v-list-item-content>
                        <v-list-item-title>{{ recentProject.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ recentProject.path }}</v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                        <v-tooltip top>
                            <template v-slot:activator="{ on }">
                                <v-icon color="grey lighten-1" v-on="on">mdi-information</v-icon>
                            </template>
                            <span>Last opened on {{ recentProject.lastOpened.toLocaleDateString() }}</span>
                        </v-tooltip>
                    </v-list-item-action>
                </v-list-item>
            </v-list>
        </div>
        <div v-else>
            <span>
                No recent projects. Use one of the buttons above to create a new project or load an existing one.
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import RecentProjectsManager from "@/logic/filesystem/project/RecentProjectsManager";
import RecentProject from "@/logic/filesystem/project/RecentProject";
const { dialog } = require("electron").remote;

@Component({})
export default class RecentProjects extends Vue {
    private recentProjects: RecentProject[] = [];

    private async mounted() {
        const recentMng = new RecentProjectsManager();
        this.recentProjects.push(...await recentMng.getRecentProjects());
    }

    private async openProject() {
        this.$emit("open-project");
    }

    private async createProject() {
        this.$emit("create-project");
    }

    private async openPreviouslyLoadedProject(path: string) {
        this.$emit("open-project", path);
    }
}
</script>

<style>
    .open-project-button {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .open-project-button a {
        margin-left: 8px;
    }
</style>
