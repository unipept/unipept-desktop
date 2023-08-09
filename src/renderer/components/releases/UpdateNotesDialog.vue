<template>
    <v-dialog v-model="isDialogActive">
        <v-card>
            <v-card-title>
                Available updates
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
                    <div>
                        Your current version of Unipept Desktop is outdated. The following updates are available and
                        will be automatically installed in the background:
                    </div>
                    <div
                        class="mt-4 release-notes"
                        v-html="releaseContent"
                    />
                </div>
                <div class="text-center mt-4">
                    <v-btn
                        color="primary"
                        @click="isDialogActive = false"
                    >
                        Dismiss
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import ComparatorUtils from "@renderer/logic/utils/ComparatorUtils";
import GitHubCommunicator from "@renderer/logic/communication/github/GithubCommunicator";
import { marked } from "marked";

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void
}>();

const isDialogActive = ref(props.modelValue);
const isLoading = ref(true);

watch(() => props.modelValue, (newValue) => {
    isDialogActive.value = newValue;
});

watch(() => isDialogActive.value, (newValue) => {
    emit("update:modelValue", newValue);
});

const releaseContent = ref("");
const retrieveReleaseNotes = async function() {
    isLoading.value = true;

    try {
        const communicator = new GitHubCommunicator();
        const appVersion = await window.api.app.versions.app;
        const allReleases = (await communicator.getAllReleases()).filter(
            (rel) => ComparatorUtils.isVersionLargerThan(rel, appVersion)
        );

        let releaseNotes = "";
        for (const release of allReleases) {
            // Add title for this release
            releaseNotes += `### Unipept Desktop ${release}\n`;
            releaseNotes += await communicator.getReleaseNotes(release) + "\n\n";
        }

        releaseContent.value = marked(releaseNotes);
    } catch (error) {
        releaseContent.value = "Could not load release notes. Make sure you're connected to the internet."
    } finally {
        isLoading.value = false;
    }
}

retrieveReleaseNotes();

</script>

<style scoped>

</style>
