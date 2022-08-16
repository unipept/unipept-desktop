<template>
    <div class="mx-12">
        <h2>Recent projects</h2>
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
        <v-tooltip bottom open-delay="500">
            <template v-slot:activator="{ on }">
                <div class="open-project-button" @click="openProject">
                    <v-icon>mdi-folder-open-outline</v-icon>
                    <a>Open a project that's not shown in this list...</a>
                </div>
            </template>
            <span>Select a previously created project to open.</span>
        </v-tooltip>
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
