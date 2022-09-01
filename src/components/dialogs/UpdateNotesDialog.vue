<template>
    <v-dialog v-model="dialogActive" max-width="600">
        <v-card>
            <v-card-title>
                Available updates
            </v-card-title>
            <v-card-text>
                <div v-if="loading" class="text-center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
                <div v-else>
                    <div>
                        Your current version of Unipept Desktop is outdated. The following updates are available and
                        will be automatically installed in the background:
                    </div>
                    <div v-html="releaseContent" class="mt-4 release-notes"></div>
                </div>
                <div class="text-center mt-4">
                    <v-btn @click="dialogActive = false" color="primary">Dismiss</v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import GitHubCommunicator from "@/logic/communication/github/GitHubCommunicator";
import { NetworkUtils } from "unipept-web-components";
import marked from "marked";
import Utils from "@/logic/Utils";

const { app } = require("@electron/remote");

@Component
export default class UpdateNotesDialog extends Vue {
    @Prop({ required: true })
    private value: boolean;

    private dialogActive = false;
    private loading = false;
    private appVersion = "";
    private releaseContent = "";

    private mounted() {
        this.appVersion = app.getVersion();
        this.retrieveReleaseNotes();
    }

    @Watch("value", { immediate: true })
    private onValueChanged() {
        this.dialogActive = this.value;
        this.retrieveReleaseNotes();
    }

    @Watch("dialogActive")
    private onDialogActiveChanged() {
        this.$emit("input", this.dialogActive);
    }

    private async retrieveReleaseNotes() {
        if (this.dialogActive) {
            this.loading = true;
            try {
                const communicator = new GitHubCommunicator();
                const allReleases = (await communicator.getAllReleases()).filter(
                    (rel) => Utils.isVersionLargerThan(rel, this.appVersion)
                );

                let releaseNotes = "";
                for (const release of allReleases) {
                    // Add title for this release
                    releaseNotes += `### Unipept Desktop ${release}\n`;
                    releaseNotes += await communicator.getReleaseNotes(release) + "\n\n";
                }

                this.releaseContent = marked(releaseNotes);
            } catch (error) {
                this.releaseContent = "Could not load release notes. Make sure you're connected to the internet."
            }
            this.loading = false;
        }
    }

    private openReleasePage() {
        NetworkUtils.openInBrowser(`https://github.com/unipept/unipept-desktop/releases/tag/v${this.appVersion}`)
    }
}
</script>

<style>
    .release-notes h3 {
        margin-top: 16px;
    }

    .release-notes {
        max-height: 500px;
        overflow-y: auto;
    }
</style>
