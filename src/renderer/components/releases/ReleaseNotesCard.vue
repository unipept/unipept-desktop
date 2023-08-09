<template>
    <v-card>
        <v-card-title>
            Unipept Desktop v{{ appVersion }} - release notes
        </v-card-title>
        <v-card-text>
            <div
                v-if="isLoading"
                class="text-center"
            >
                <v-progress-circular
                    indeterminate
                    color="primary"
                />
            </div>
            <div v-else>
                <div v-html="releaseContent" />
                <div class="mt-4">
                    Check our
                    <a @click="openInBrowser(`https://github.com/unipept/unipept-desktop/releases/tag/v${appVersion}`)">
                        release page
                    </a> on GitHub for more information.
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { openInBrowser } from "@renderer/logic/utils/BrowserUtils";
import { marked } from "marked";
import GitHubCommunicator from "@renderer/logic/communication/github/GithubCommunicator";

const isLoading = ref(true);

const releaseContent = ref("");
const appVersion = ref("");

const retrieveReleaseNotes = async function() {
    isLoading.value = true;
    try {
        appVersion.value = await window.api.app.versions.app;

        const communicator = new GitHubCommunicator();
        const releaseNotes = await communicator.getReleaseNotes(appVersion.value);
        releaseContent.value = marked(releaseNotes);
    } catch (e) {
        releaseContent.value = "Could not load release notes. Make sure you're connected to the internet."
    } finally {
        isLoading.value = false;
    }
}

retrieveReleaseNotes();
</script>

<style scoped>

</style>
