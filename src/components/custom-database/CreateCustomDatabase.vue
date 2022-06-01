<template>
    <v-dialog max-width="1200px" v-model="dialogActive">
        <v-card>
            <v-card-title>
                Create new custom database
            </v-card-title>
            <v-card-text v-if="error" class="d-flex flex-column align-center">
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
            </v-card-text>
            <v-card-text v-else-if="loading" class="d-flex flex-column align-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <span>Looking up all current UniProt versions...</span>
            </v-card-text>
            <v-stepper v-else v-model="currentStep" outlined flat >
                <v-stepper-header style="box-shadow: none; border-bottom: thin solid rgba(0,0,0,.12);">
                    <v-stepper-step step="1" :complete="currentStep > 1" editable>
                        General details
                    </v-stepper-step>
                    <v-divider></v-divider>
                    <v-stepper-step step="2" :complete="currentStep > 2" editable>
                        Filter by taxa
                    </v-stepper-step>
                    <v-divider></v-divider>
                    <v-stepper-step step="3" :complete="currentStep > 3" editable>
                        Construction details
                    </v-stepper-step>
                </v-stepper-header>

                <v-stepper-items>
                    <v-stepper-content step="1" style="padding-top: 16px;">
                        <v-form ref="databaseForm">
                            <v-container fluid>
                                <v-row>
                                    <v-col cols="12">
                                        <v-text-field
                                            dense
                                            label="Database name"
                                            hint="Give your database a name to easily recognize it."
                                            persistent-hint
                                            :rules="[
                                                value => !! value || 'Provide a valid name for your database',
                                                value => isDbNameUnique(value) || 'Another database with this name already exists'
                                            ]"
                                            v-model="databaseName">
                                        </v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-select
                                            dense
                                            label="Database sources"
                                            hint="Select all database sources that should be filtered."
                                            v-model="selectedSources"
                                            :rules="[selectedSources.length > 0 || 'At least one source should be selected']"
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
                                            v-model="selectedVersion"
                                            :rules="[value => !! value || 'You must select a UniProt source']"
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
                                            :rules="[value => !! value || 'You must select a UniProt mirror']"
                                            v-model="selectedMirror"
                                            persistent-hint
                                            hint="Select the mirror that's closest to your physical location to help speed up the download process.">
                                        </v-select>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-form>
                        <div class="d-flex justify-end mb-2">
                            <v-btn color="primary" @click="validateAndContinue()">Continue</v-btn>
                        </div>
                    </v-stepper-content>

                    <v-stepper-content step="2">
                        <div class="mb-3">
                            The taxa that you select in this step determine which UniProt entries will be part of your
                            final custom database. Note that all children of a specific taxon will also always be
                            included in the final end result. Remember that the amount of selected taxa has a direct
                            impact on the size and performance of the resulting database. More taxa equals larger
                            databases and increased lookup time.
                        </div>
<!--                        <taxa-tree></taxa-tree>-->
                        <taxa-browser v-on:input="updateSelectedTaxa"></taxa-browser>

                        <div class="d-flex justify-end mb-2">
                            <div class="flex-grow-1">
                                <v-btn @click="currentStep = 1">Go back</v-btn>
                            </div>
                            <v-btn color="primary" @click="currentStep = 3">Continue</v-btn>
                        </div>
                    </v-stepper-content>

                    <v-stepper-content step="3">
                        <div class="mb-3">
                            Below is a summary of all construction settings that you selected. Please confirm that these
                            are correct before continuing the build process.
                        </div>

                        <h4>Database details</h4>
                        <v-simple-table dense>
                            <template v-slot:default>
                                <tbody>
                                <tr>
                                    <td>Database name</td>
                                    <td>{{ databaseName }}</td>
                                </tr>
                                <tr>
                                    <td>Database sources</td>
                                    <td>{{ selectedSources.join(", ") }}</td>
                                </tr>
                                <tr>
                                    <td>UniProt database version</td>
                                    <td>{{ selectedVersion }}</td>
                                </tr>
                                <tr>
                                    <td>UniProt mirror</td>
                                    <td>{{ selectedMirror }}</td>
                                </tr>
                                </tbody>
                            </template>
                        </v-simple-table>

                        <h4 class="mt-2">Selected taxa</h4>
                        <div style="max-height: 300px; overflow: auto;">
                            <v-simple-table dense>
                                <template v-slot:default>
                                    <thead>
                                    <tr>
                                        <th class="text-left">
                                            ID
                                        </th>
                                        <th class="text-left">
                                            Name
                                        </th>
                                        <th class="text-left">
                                            Rank
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr v-for="item in selectedTaxa" :key="item.id">
                                        <td>{{ item.id }}</td>
                                        <td>{{ item.name }}</td>
                                        <td>{{ item.rank }}</td>
                                    </tr>
                                    </tbody>
                                </template>
                            </v-simple-table>
                        </div>

                        <div class="d-flex justify-end mt-4 mb-2">
                            <div class="flex-grow-1">
                                <v-btn @click="currentStep = 2">Go back</v-btn>
                            </div>
                            <v-btn color="primary" @click="buildDatabase()">Build database</v-btn>
                        </div>
                    </v-stepper-content>
                </v-stepper-items>
            </v-stepper>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import axios from "axios";

import https from "https";
import TaxaBrowser from "@/components/taxon/TaxaBrowser.vue";
import {
    CountTable,
    LcaCountTableProcessor,
    NcbiId,
    NcbiOntologyProcessor,
    NcbiTaxon,
    Tree,
    TreeNode
} from "unipept-web-components";
import { Prop, Watch } from "vue-property-decorator";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";

@Component({
    components: { TaxaBrowser }
})
export default class CreateCustomDatabase extends Vue {
    @Prop({ required: true })
    private value: boolean;

    private dialogActive: boolean = false;

    private loading: boolean = true;
    private error: boolean = false;

    private sources: string[] = [
        "TrEMBL",
        "SwissProt"
    ];
    private selectedSources: string[] = []

    private databaseName: string = "";

    private mirrors: string[] = ["UK (EBI)", "EU (Expasy)", "US (UniProt)"];
    private selectedMirror: string = "EU (Expasy)";

    // All database versions of UniPept that are currently available
    private versions: String[] = [];
    private selectedVersion: string = "Current";

    private selectedTaxa: NcbiTaxon[] = [];

    private currentStep: number = 1;

    private async mounted() {
        this.onValueChanged();
        this.selectedMirror = this.getMostSuitableMirror();
        await this.retrieveUniProtVersions();
    }

    /**
     * Checks if the provided database name is unique (i.e. does not already exists). Databases with the same name
     * cannot exist at the same time due to compatibility issues.
     *
     * @param name The name of the database for which uniqueness should be tested.
     * @return true if this database name is not yet taken.
     */
    private isDbNameUnique(name: string): boolean {
        return ! this.$store.getters["customDatabases/databases"].some((db: CustomDatabase) => db.name === name);
    }

    private updateSelectedTaxa(value: NcbiTaxon[]): void {
        this.selectedTaxa.splice(0, this.selectedTaxa.length);
        this.selectedTaxa.push(...value);
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
            this.versions.unshift("Current");
            this.loading = false;
        } catch (e) {
            this.error = true;
        }
    }

    private validateAndContinue(): void {
        // @ts-ignore
        if (this.$refs.databaseForm.validate()) {
            this.currentStep = 2;
        }
    }

    private async buildDatabase(): Promise<void> {
        const sourceUrlMap = {
            "TrEMBL": "https://ftp.expasy.org/databases/uniprot/current_release/knowledgebase/complete/uniprot_trembl.xml.gz",
            // "TrEMBL": "host.docker.internal:8000/uniprot_trembl.xml.gz",
            "SwissProt": "https://ftp.expasy.org/databases/uniprot/current_release/knowledgebase/complete/uniprot_sprot.xml.gz"
        }

        const configManager = new ConfigurationManager();

        this.$store.dispatch(
            "customDatabases/buildDatabase",
            [
                this.databaseName,
                this.selectedSources.map(source => (sourceUrlMap as any)[source]),
                this.selectedSources,
                this.selectedTaxa.map(taxon => taxon.id),
                await configManager.readConfiguration()
            ]
        );
        this.dialogActive = false;

        // After a database construction was started, we need to reset this wizard and prepare it for the next user.
        this.resetWizard();
    }

    /**
     * Reset the database construction wizard in this dialog to it's initial state.
     */
    private resetWizard(): void {
        this.currentStep = 1;
        this.selectedTaxa.splice(0, this.selectedTaxa.length);
        this.databaseName = "";
        this.selectedSources.splice(0, this.selectedSources.length);
        this.selectedVersion = "Current";
        this.error = false;
        (this.$refs.databaseForm as any).reset();
    }

    /**
     * This function checks the user's current timezone settings and uses this information to determine what the most
     * suitable mirror is that can be used for his present location. Note that this is only an estimate.
     */
    private getMostSuitableMirror(): string {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (timezone.includes("London") || timezone.includes("Dublin")) {
            // Return UK-based mirror
            return "UK (EBI)";
        } else if (timezone.includes("Europe")) {
            return "EU (Expasy)";
        } else {
            return "US (UniProt)";
        }
    }

    @Watch("value")
    private onValueChanged() {
        this.dialogActive = this.value;
    }

    @Watch("dialogActive")
    private onRemoveConfirmationActiveChanged() {
        this.$emit("input", this.dialogActive);
    }
}
</script>

<style scoped>
    .settings-title {
        color: black;
        font-size: 18px;
    }
</style>
