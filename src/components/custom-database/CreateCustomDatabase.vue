<template>
    <v-dialog max-width="1200px" v-model="dialogActive">
        <v-card>
            <v-card-title>
                Create custom database
                <v-spacer></v-spacer>
                <v-btn icon @click="dialogActive = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text v-if="error" class="d-flex flex-column align-center mt-2">
                <v-icon x-large color="error" class="mb-4">
                    mdi-alert-circle
                </v-icon>
                <div>
                    Could not retrieve a list of the current UniProtKB versions...
                </div>
                <div>
                    Please <a @click="retrieveUniProtVersions">try again</a>
                    later or contact us if the problem persists. Make sure that you are connected to the internet.
                </div>
            </v-card-text>
            <v-card-text v-else-if="loading" class="d-flex flex-column align-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <span>Looking up all current UniProtKB versions...</span>
            </v-card-text>
            <v-card-text v-else class="mt-2">
                <v-stepper v-model="currentStep" vertical flat>
                    <v-stepper-step step="1" :complete="currentStep > 1">
                        Database details
                        <small>Provide basic construction details</small>
                    </v-stepper-step>

                    <v-stepper-content step="1">
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
                                                    value => !! value ||
                                                        'Provide a valid name for your database',
                                                    value => isDbNameUnique(value) ||
                                                        'Another database with this name already exists'
                                                ]"
                                            v-model="databaseName">
                                        </v-text-field>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-select
                                            dense
                                            label="Database sources"
                                            hint="Select all database sources that should be filtered."
                                            v-model="selectedSources"
                                            :rules="[
                                                    selectedSources.length > 0 ||
                                                    'At least one source should be selected'
                                                ]"
                                            persistent-hint
                                            multiple
                                            :items="sources">
                                        </v-select>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-text-field
                                            readonly
                                            dense
                                            v-model="selectedVersion"
                                            label="Latest UniProt version">

                                        </v-text-field>
<!--                                        <v-select-->
<!--                                            dense-->
<!--                                            label="Database version"-->
<!--                                            :items="versions"-->
<!--                                            v-model="selectedVersion"-->
<!--                                            :rules="[value => !! value || 'You must select a UniProtKB source']"-->
<!--                                            hint="Select the version of the UniProtKB source that should be processed."-->
<!--                                            persistent-hint>-->
<!--                                        </v-select>-->
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col cols="12">
                                        <v-btn color="primary" @click="validateAndContinue">Continue</v-btn>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-form>
                    </v-stepper-content>

                    <v-stepper-step step="2" :complete="currentStep > 2">
                        Filter
                        <small>Select which organisms will be present in the output database</small>
                    </v-stepper-step>

                    <v-stepper-content step="2">
                        <v-container>
                            <v-row>
                                <v-col cols="12">
                                    <div>
                                        <taxa-browser v-on:input="updateSelectedTaxa"></taxa-browser>
                                    </div>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="12">
                                    <v-btn class="mr-2" @click="currentStep = 1">Go back</v-btn>
                                    <v-btn color="primary" @click="buildDatabase()">Build database</v-btn>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-stepper-content>
                </v-stepper>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import axios from "axios";

import https from "https";
import TaxaBrowser from "@/components/taxon/TaxaBrowser.vue";
import { NcbiTaxon } from "unipept-web-components";
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
    @Prop({ required: false, default: () => [] as string[] })
    private selectedSourcesDefault: string[];
    @Prop({ required: false, default: "" })
    private databaseNameDefault: string;
    // @Prop({ required: false, default: "Current" })
    // private selectedVersionDefault: string;
    @Prop({ required: false, default: () => [] as NcbiTaxon[] })
    private selectedTaxaDefault: NcbiTaxon[];

    private dialogActive: boolean = false;

    private loading: boolean = true;
    private error: boolean = false;

    private sources: string[] = [
        "TrEMBL",
        "SwissProt"
    ];
    private selectedSources: string[] = [];

    private databaseName: string = "";

    private mirrors: string[] = ["UK (EBI)", "EU (Expasy)", "US (UniProt)"];
    private selectedMirror: string = "EU (Expasy)";

    // All database versions of UniPept that are currently available
    // private versions: string[] = [];
    private selectedVersion: string = "";

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
            // const data = await new Promise<string>((resolve) => {
            //     let data = "";
            //     https.get("https://ftp.uniprot.org/pub/databases/uniprot/previous_releases/", (res) => {
            //         res.on("data", (chunk) => data += chunk);
            //         res.on("end", () => resolve(data));
            //     });
            // });
            //
            // for (const version of data.match(/release-[0-9]{4}_[0-9]{2}/g)) {
            //     this.versions.push(version.replace("release-", "").replace("_", "."));
            // }
            // this.versions.sort().reverse();

            // We also have to find out what the current version of UniProt is and add it to the list.
            const latestVersionData = await new Promise<string>((resolve) => {
                let data = "";
                https.get("https://ftp.uniprot.org/pub/databases/uniprot/current_release/RELEASE.metalink", (res) => {
                    res.on("data", (chunk) => data += chunk);
                    res.on("end", () => resolve(data));
                });
            });

            const lastVersion: string = latestVersionData
                .split("\n")
                .map(line => line.trim())
                .filter(line => line.includes("<version>"))[0]
                .replaceAll(/<\/*version>/g, "")
                .replace("_", ".")

            this.selectedVersion = lastVersion;
            this.loading = false;
        } catch (e) {
            console.error(e);
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
        // No filtering should be applied in this case (which means we pass only the root to the construction step of
        // the database).
        if (this.selectedTaxa.length === 0) {
            this.selectedTaxa.push(new NcbiTaxon(1, "root", "dummy", []));
        }

        const convertedSources = this.selectedSources.map(s => s.toLowerCase());

        this.$store.dispatch(
            "customDatabases/buildDatabase",
            [
                this.databaseName,
                convertedSources,
                this.selectedTaxa.map(taxon => taxon.id),
                this.selectedVersion
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
        (this.$refs.databaseForm as any).reset();
        this.selectedSources.splice(0, this.selectedSources.length);
        this.selectedVersion = this.sources[0];
        this.selectedMirror = "EU (Expasy)";
        this.error = false;
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
        if (this.value) {
            // Reset to the default supplied values.
            this.selectedSources.splice(0, this.selectedSources.length);
            this.selectedSources.push(...this.selectedSourcesDefault);
            this.databaseName = this.databaseNameDefault;
            // this.selectedVersion = this.selectedVersionDefault;
            this.selectedTaxa.splice(0, this.selectedTaxa.length);
            this.selectedTaxa.push(...this.selectedTaxaDefault);
        }

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
