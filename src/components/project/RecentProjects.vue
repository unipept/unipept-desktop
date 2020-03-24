<template>
    <div>
        <div v-if="recentProjects.length > 0">
            <span>Recent projects</span>
            <v-list two-line>
                <v-list-item
                    v-for="recentProject of recentProjects"
                    :key="recentProject.name"
                    @click="openPreviouslyLoadedProject(recentProject.path)">
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
        <tooltip message="Select a previously created project to open." position="bottom">
            <div class="open-project-button" @click="openProject()">
                <v-icon>mdi-folder-open-outline</v-icon>
                <a>Open project...</a>
            </div>
        </tooltip>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import ProjectManager from "@/logic/filesystem/project/ProjectManager.ts";
import RecentProjectsManager from "@/logic/filesystem/project/RecentProjectsManager";
import RecentProject from "@/logic/filesystem/project/RecentProject";
const { dialog } = require("electron").remote;

@Component({
    components: {
        Tooltip
    }
})
export default class RecentProjects extends Vue {
    private recentProjects: RecentProject[] = [];

    private async mounted() {
        const recentMng = new RecentProjectsManager();
        this.recentProjects.push(...await recentMng.getRecentProjects());
    }

    private async openProject() {
        const chosenPath: string | undefined = dialog.showOpenDialogSync({
            properties: ["openDirectory"]
        });

        if (chosenPath) {
            this.$emit("open-project", chosenPath[0]);
        }
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
