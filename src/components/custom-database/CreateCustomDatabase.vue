<template>
    <v-card>
        <v-card-title>
            Create custom database
        </v-card-title>
        <v-card-text>
            <div v-if="error" class="d-flex flex-column align-center">
                <v-icon x-large color="error" class="mb-4">
                    mdi-alert-circle
                </v-icon>
                <div>
                    Could not retrieve a list of the current UniProt versions...
                </div>
                <div>
                    Please <a @click="retrieveUniProtVersions">try again</a>
                    later or contact us if the problem persists. Make sure that you are connected to the internet.
                </div>
            </div>
            <div v-else-if="loading" class="d-flex flex-column align-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <span>Looking up all current UniProt versions...</span>
            </div>
            <v-container v-else>
                <v-row>
                    <v-col cols="6" class="py-0">
                        <v-select
                            dense
                            filled
                            label="Database sources"
                            hint="Select all database sources that should be filtered."
                            persistent-hint
                            multiple
                            :items="sources">
                        </v-select>
                    </v-col>
                    <v-col cols="6" class="py-0">
                        <v-select filled dense label="Database version" :items="versions"></v-select>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12" class="py-0">
                        <v-checkbox dense hide-details label="Use UniProt US mirror" class="mt-0" v-model="useUsMirror"></v-checkbox>
                        <span class="font-weight-light">
                            A UniProt mirror that's located in the EU is used by default. Tick this box if you're
                            located closer to the US.
                        </span>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <span>Filter</span>
                        <div>
                            Please select a range of taxa that should be included in this custom database.
                        </div>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <div class="d-flex flex-row justify-center">
                            <v-btn class="mr-2">Cancel</v-btn>
                            <v-btn color="primary">Continue</v-btn>
                        </div>
                    </v-col>
                </v-row>
            </v-container>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import axios from "axios";

import https from "https";

@Component
export default class CreateCustomDatabase extends Vue {
    private loading: boolean = true;
    private error: boolean = false;
    private sources: String[] = [
        "TrEMBL",
        "SwissProt"
    ];
    private useUsMirror: boolean = false;

    // All database versions of UniPept that are currently available
    private versions: String[] = [];

    private async mounted() {
        await this.retrieveUniProtVersions();
    }

    private async retrieveUniProtVersions(): Promise<void> {
        try {
            this.loading = true;
            const data = await new Promise<String>((resolve) => {
                let data = "";
                https.get("https://ftp.uniprot.org/pub/databases/uniprot/previous_releases/", (res) => {
                    res.on("data", (chunk) => data += chunk);
                    res.on("end", () => resolve(data));
                });
            });

            for (const version of data.match(/release-[0-9]{4}_[0-9]{2}/g)) {
                this.versions.push(version.replace("release-", "").replace("_", "."));
            }
            this.versions.sort().reverse();
            this.loading = false;
        } catch (e) {
            this.error = true;
        }
    }
}
</script>

<style scoped>

</style>
