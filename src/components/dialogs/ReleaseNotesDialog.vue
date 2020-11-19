<template>
    <v-dialog v-model="dialogActive" max-width="600">
        <v-card>
            <v-card-title>
                Unipept Desktop v{{ appVersion }} - release notes
            </v-card-title>
            <v-card-text>
                <div v-if="loading" class="text-center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
                <div v-else>
                    <div v-html="releaseContent"></div>
                    <div class="mt-4">
                        Check our
                        <a @click="openReleasePage">
                            release page
                        </a> on GitHub for more information.
                    </div>
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

const electron = require("electron");
const app = electron.remote.app;

@Component
export default class ReleaseNotesDialog extends Vue {
    @Prop({ required: true })
    private value: boolean;

    private dialogActive: boolean = false;
    private loading: boolean = false;
    private appVersion: string = "";
    private releaseContent: string = "";

    private mounted() {
        this.appVersion = app.getVersion();
        this.retrieveReleaseNotes();
    }

    @Watch("value", { immediate: true })
    private onValueChanged() {
        this.dialogActive = this.value;
    }

    @Watch("dialogActive")
    private onDialogActiveChanged() {
        this.$emit("input", this.dialogActive);
    }

    private async retrieveReleaseNotes() {
        this.loading = true;
        try {
            const communicator = new GitHubCommunicator();
            const releaseNotes = await communicator.getReleaseNotes(app.getVersion());
            this.releaseContent = marked(releaseNotes);
        } catch (error) {
            this.releaseContent = "Could not load release notes. Make sure you're connected to the internet."
        }
        this.loading = false;
    }

    private openReleasePage() {
        NetworkUtils.openInBrowser(`https://github.com/unipept/unipept-desktop/releases/tag/v${this.appVersion}`)
    }
}
</script>

<style scoped>

</style>
