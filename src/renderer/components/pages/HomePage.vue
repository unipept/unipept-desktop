<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <div class="mx-12">
                    <h2>Project management</h2>
                </div>
            </v-col>
            <v-divider vertical />
            <v-col>
                <div class="d-flex justify-center align-center mt-12">
                    <img
                        src="@renderer/assets/images/icon.png"
                        style="max-width: 200px;"
                    >
                    <div class="d-flex flex-column align-center justify-center ml-4">
                        <span class="logo-headline">
                            Unipept Desktop {{ appVersion }}
                        </span>
                        <span class="logo-subline">
                            Chrome v{{ chromeVersion }}
                        </span>
                        <span class="logo-subline">
                            Electron v{{ electronVersion }}
                        </span>
                        <span
                            v-if="updateAvailable"
                            class="logo-subline"
                            @click="openUpdateNotesDialog()"
                        >
                            <v-icon
                                style="position: relative; bottom: 2px;"
                                color="success"
                            >
                                mdi-arrow-up-bold
                            </v-icon>
                            <a>An update is available!</a>
                        </span>
                    </div>
                </div>
                <!-- Release notes (display changes compared previous version of the application) -->
                <!-- <release-notes-card class="mt-12 mx-12"></release-notes-card> -->
            </v-col>
        </v-row>
    </v-container>
    <update-notes-dialog v-model="isUpdateNotesDialogActive" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GithubCommunicator from "@renderer/logic/communication/github/GithubCommunicator";
import ComparatorUtils from "@renderer/logic/utils/ComparatorUtils";
import UpdateNotesDialog from "@renderer/components/releases/UpdateNotesDialog.vue";

const appVersion = ref(await window.api.app.versions.app);
const chromeVersion = ref(await window.api.app.versions.chrome);
const electronVersion = ref(await window.api.app.versions.electron);

const githubCommunicator = new GithubCommunicator();
const remoteVersion = ref(await githubCommunicator.getMostRecentVersion());
const updateAvailable = ref(ComparatorUtils.isVersionLargerThan(remoteVersion.value, appVersion.value));

const isUpdateNotesDialogActive = ref(false);
const openUpdateNotesDialog = function() {
    isUpdateNotesDialogActive.value = true;
}

</script>

<style scoped>
.logo-headline {
    margin-top: 8px;
    font-size: 24px;
    color: black;
}

.logo-subline {
    font-size: 16px;
    color: #777;
}
</style>
