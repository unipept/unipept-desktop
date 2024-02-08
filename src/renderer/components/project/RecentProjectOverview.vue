<template>
    <div class="mx-12">
        <h2>Recent projects</h2>

        <v-list lines="two">
            <v-list-item
                v-for="recentProject of recentProjects"
                :key="recentProject.path"
                :title="recentProject.name"
                :subtitle="recentProject.path"
            >
                <template v-slot:prepend>
                    <v-avatar>
                        <v-icon>mdi-folder-outline</v-icon>
                    </v-avatar>
                </template>

                <template v-slot:append>
                    <v-tooltip :text="recentProject.lastOpened.toLocaleDateString()">
                        <template #activator="{ props }">
                            <v-btn
                                icon="mdi-information-outline"
                                variant="text"
                                v-bind="props"
                            />
                        </template>
                    </v-tooltip>
                </template>

            </v-list-item>
        </v-list>

        <div
            class="open-project-button"
        >
            <v-tooltip
                activator="parent"
            >
                Select a previously created project to open.
            </v-tooltip>
            <v-icon class="mr-2">
                mdi-folder-open-outline
            </v-icon>
            <a>Open a project that's not shown in this list...</a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Ref, ref } from "vue";
import RemoteRecentProjectManager from "@renderer/logic/project/RemoteRecentProjectManager";
import RecentProject from "@common/project/RecentProject";

const recentProjectManager = new RemoteRecentProjectManager();

const recentProjects: Ref<RecentProject[]> = ref([]);
recentProjects.value = await recentProjectManager.getRecentProjects();
</script>

<style scoped>
    .open-project-button {
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
