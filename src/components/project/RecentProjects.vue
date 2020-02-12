<template>
    <div>
        <span>Recent projects</span>
        <v-list two-line>
            <v-list-item v-for="recentProject of recentProjects" :key="recentProject.name" @click="() => {}">
                <v-list-item-content>
                    <v-list-item-title>{{ recentProject.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ recentProject.path }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                    <v-tooltip top>
                        <template v-slot:activator="{ on }">
                            <v-icon color="grey lighten-1" v-on="on">mdi-information</v-icon>
                        </template>
                        <span>Last opened on {{ recentProject.lastOpened }}</span>
                    </v-tooltip>
                </v-list-item-action>
            </v-list-item>
        </v-list>
        <div class="open-project-button">
            <v-icon>mdi-folder-open-outline</v-icon>
            <a>Open other project...</a>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class RecentProjects extends Vue {
    private recentProjects: { name: string, path: string, lastOpened: string }[] = [
        {
            name: "My Project",
            path: "/usr/pverscha/Desktop/My Project",
            lastOpened: "November 22, 2019"
        },
        {
            name: "Test",
            path: "/usr/pverscha/Documents/Unipept/Test",
            lastOpened: "February 12, 2020"
        }
    ];
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