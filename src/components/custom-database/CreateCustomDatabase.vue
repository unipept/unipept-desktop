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
                    <v-col cols="12">
                        <div class="settings-title">General settings</div>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <v-text-field
                            label="Database name"
                            hint="Give your database a name to easily recognize it."
                            persistent-hint
                            v-model="databaseName">
                        </v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-select
                            dense
                            label="Database sources"
                            hint="Select all database sources that should be filtered."
                            persistent-hint
                            multiple
                            :items="sources">
                        </v-select>
                    </v-col>
                    <v-col cols="12">
                        <v-select
                            dense
                            label="Database version"
                            :items="versions"
                            hint="Select the version of the UniProt source that should be processed."
                            persistent-hint>
                        </v-select>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <v-select
                            dense
                            label="UniProt mirror"
                            :items="mirrors"
                            persistent-hint
                            hint="Select the mirror that's closest to your physical location to help speed up the download process.">
                        </v-select>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <div class="settings-title">Filter</div>
                        <div>
                            Please select a range of taxa that should be included in this custom database.
                        </div>
                        <taxa-browser></taxa-browser>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <div class="d-flex flex-row justify-center">
                            <v-btn class="mr-2">Cancel</v-btn>
                            <v-btn color="primary" @click="buildDatabase">Continue</v-btn>
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
import TaxaBrowser from "@/components/taxon/TaxaBrowser.vue";
@Component({
    components: { TaxaBrowser }
})
export default class CreateCustomDatabase extends Vue {
    private loading: boolean = true;
    private error: boolean = false;
    private sources: String[] = [
        "TrEMBL",
        "SwissProt"
    ];
    private databaseName: string = "";
    private mirrors: string[] = ["EU (EBI)", "US (UniProt)"];

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

    private async buildDatabase(): Promise<void> {
        this.$store.dispatch(
            "buildDatabase",
            [
                this.databaseName,
                ["https://ftp.expasy.org/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.xml.gz"],
                ["swissprot"],
                [33090],
                "/Volumes/T7/database/mysql",
                "/Volumes/T7/database/index",
            ]
        );
    }
}
</script>

<style scoped>
    .settings-title {
        color: black;
        font-size: 18px;
    }
</style>
