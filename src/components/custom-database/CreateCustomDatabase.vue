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
                    <v-stepper-step step="1" :complete="currentStep > 1" :editable="currentStep > 1">
                        Database name
                        <small>Provide basic construction details</small>
                    </v-stepper-step>

                    <v-stepper-content step="1">
                        <v-form ref="databaseNameForm">
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
                                </v-row>
                                <v-row>
                                    <v-col cols="12">
                                        <v-btn color="primary" @click="validateDatabaseNameAndContinue()">
                                            Continue
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-form>
                    </v-stepper-content>

                    <v-stepper-step step="2" :complete="currentStep > 2" :editable="currentStep > 2">
                        Construction method
                        <small>Please select how you want to construct the database</small>
                    </v-stepper-step>

                    <v-stepper-content step="2">
                        <v-container fluid>
                            <v-row>
                                <v-col cols="6" class="d-flex">
                                        <span>
                                            Manually select which UniProt sources (e.g. TrEMBL and SwissProt) should be
                                            used for the database construction and which proteins should be included
                                            based on a given set of taxa.
                                        </span>
                                </v-col>
                                <v-col cols="6" class="d-flex">
                                        <span>
                                            Provide a list of UniProt reference proteomes that should be used as the
                                            basis for a custom protein reference database. All available UniProt sources
                                            (both TrEMBL and SwissProt) will be consulted in this case.
                                        </span>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="6" class="d-flex flex-column">
                                    <v-btn @click="manuallyFilterDatabase">
                                        Manually filter database
                                    </v-btn>
                                </v-col>
                                <v-col cols="6" class="d-flex flex-column">
                                    <v-btn @click="filterByProteomes">
                                        Construct from reference proteomes
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-stepper-content>

                    <div v-if="useProteomeFilter">
                        <v-stepper-step step="3" :complete="currentStep > 3" :editable="currentStep > 3">
                            Select reference proteomes
                            <small>Decide on a set of reference proteomes that should be present in the database</small>
                        </v-stepper-step>

                        <v-stepper-content step="3">
                            <v-container fluid>
                                <v-row>
                                    <v-col cols="12">
                                        <div class="d-flex">
                                            <v-text-field
                                                dense
                                                label="Reference proteome identifier"
                                                hint="Provide a unique UniProtKB reference proteome identifier (e.g. UP000005640)."
                                                persistent-hint
                                                :error="referenceProteomeError !== ''"
                                                :error-messages="referenceProteomeError"
                                                v-model="referenceProteome">
                                            </v-text-field>
                                            <v-btn color="primary ml-2" @click="addReferenceProteome()">Add</v-btn>
                                        </div>
                                        <div>
                                            <span class="font-weight-bold">Hint:</span> browse
                                            <a @click="openInBrowser('https://www.uniprot.org/proteomes')">
                                                https://www.uniprot.org/proteomes
                                            </a>
                                            for a list of all available reference proteomes.
                                        </div>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col cols="12">
                                        <v-simple-table v-if="referenceProteomes.length > 0">
                                            <template v-slot:default>
                                                <thead>
                                                <tr>
                                                    <th class="text-left">Proteome ID</th>
                                                    <th class="text-left">Organism name</th>
                                                    <th class="text-left">Protein count</th>
                                                    <th class="text-center">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr v-for="(proteome, index) in referenceProteomes" :key="index">
                                                    <td>{{ proteome.id }}</td>
                                                    <td>{{ proteome.organismName }}</td>
                                                    <td>{{ proteome.proteinCount }}</td>
                                                    <td class="text-center">
                                                        <v-tooltip bottom open-delay="500">
                                                            <template v-slot:activator="{ on }">
                                                                <v-btn
                                                                    icon
                                                                    @click="removeReferenceProteome(index)"
                                                                    v-on="on"
                                                                    color="red">
                                                                    <v-icon>mdi-delete</v-icon>
                                                                </v-btn>
                                                            </template>
                                                            <span>Remove reference proteome from selection</span>
                                                        </v-tooltip>
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </template>
                                        </v-simple-table>
                                        <div v-else>
                                            No reference proteomes have been added yet. Find one in the search bar above
                                            and click the "Add" button.
                                        </div>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col cols="12">
                                        <v-btn class="mr-1" @click="currentStep--">Go back</v-btn>
                                        <v-btn color="primary" @click="buildDatabaseFromReferenceProteomes()">
                                            Build database
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-stepper-content>
                    </div>

                    <div v-else>
                        <v-stepper-step step="3" :complete="currentStep > 3" :editable="currentStep > 3">
                            Database sources
                            <small>Select which UniProtKB components should be processed for the database</small>
                        </v-stepper-step>

                        <v-stepper-content step="3">
                            <v-form ref="databaseSourcesForm">
                                <v-container fluid>
                                    <v-row>
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
                                            <div>
                                                <span class="font-weight-bold">Note:</span> the most recent UniProtKB
                                                version will be used for the construction of this database. The most recent
                                                version currently is {{ selectedVersion }}.
                                            </div>
    <!--                                        <v-select-->
    <!--                                        dense-->
    <!--                                        label="Database version"-->
    <!--                                        :items="versions"-->
    <!--                                        v-model="selectedVersion"-->
    <!--                                        :rules="[value => !! value || 'You must select a UniProtKB source']"-->
    <!--                                        hint="Select the version of the UniProtKB source that should be processed."-->
    <!--                                        persistent-hint>-->
    <!--                                        </v-select>-->
                                        </v-col>
                                    </v-row>
                                    <v-row>
                                        <v-col cols="12">
                                            <v-btn class="mr-1" @click="currentStep--">Go back</v-btn>
                                            <v-btn color="primary" @click="validateDatabaseSourcesAndContinue()">
                                                Continue
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-form>
                        </v-stepper-content>

                        <v-stepper-step step="4" :complete="currentStep > 4">
                            Filter
                            <small>Select which organisms will be present in the output database</small>
                        </v-stepper-step>

                        <v-stepper-content step="4">
                            <v-container fluid>
                                <v-row>
                                    <v-col cols="12">
                                        <div>
                                            <taxa-browser
                                                v-model="selectedTaxa"
                                                :swissprot-selected="selectedSources.includes('SwissProt')"
                                                :trembl-selected="selectedSources.includes('TrEMBL')"
                                            />
                                        </div>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col cols="12">
                                        <v-btn class="mr-1" @click="currentStep--">Go back</v-btn>
                                        <v-btn color="primary" @click="buildDatabase()">Build database</v-btn>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-stepper-content>
                    </div>
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
import { NcbiTaxon, NetworkUtils } from "unipept-web-components";
import { Prop, Watch } from "vue-property-decorator";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import ProteomeCommunicator from "@/logic/communication/proteomes/ProteomeCommunicator";
import Proteome from "@/logic/communication/proteomes/Proteome";
import UniProtConstants from "@/logic/communication/uniprot/UniProtConstants";

@Component({
    components: { TaxaBrowser }
})
export default class CreateCustomDatabase extends Vue {
    @Prop({ required: true })
    private value: boolean;
    @Prop({ required: false, default: () => ["TrEMBL", "SwissProt"] as string[] })
    private selectedSourcesDefault: string[];
    @Prop({ required: false, default: "" })
    private databaseNameDefault: string;
    // @Prop({ required: false, default: "Current" })
    // private selectedVersionDefault: string;
    @Prop({ required: false, default: () => [] as NcbiTaxon[] })
    private selectedTaxaDefault: NcbiTaxon[];

    private dialogActive = false;

    private loading = true;
    private error = false;

    private sources: string[] = [
        "TrEMBL",
        "SwissProt"
    ];
    // Select both TrEMBL and SwissProt by default
    private selectedSources: string[] = [...this.sources];

    private databaseName = "";

    private selectedMirror = "EU (Expasy)";

    // All database versions of UniPept that are currently available
    // private versions: string[] = [];
    private selectedVersion = "";

    private selectedTaxa: NcbiTaxon[] = [];

    private currentStep = 1;
    private useProteomeFilter = false;

    private referenceProteome = "";
    private referenceProteomes: Proteome[] = [];
    private referenceProteomeError: string = "";

    private async mounted() {
        this.onValueChanged();
        this.selectedMirror = this.getMostSuitableMirror();
        await this.retrieveUniProtVersions();
    }

    private openInBrowser(url: string) {
        NetworkUtils.openInBrowser(url);
    }

    /**
     * Checks if the provided database name is unique (i.e. does not already exists). Databases with the same name
     * cannot exist at the same time due to compatibility issues.
     *
     * @param name The name of the database for which uniqueness should be tested.
     * @return true if this database name is not yet taken.
     */
    private isDbNameUnique(name: string): boolean {
        return !this.$store.getters["customDatabases/databases"].some((db: CustomDatabase) => db.name === name);
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

    private validateDatabaseNameAndContinue(): void {
        // @ts-ignore
        if (this.$refs.databaseNameForm.validate()) {
            this.currentStep = 2;
        }
    }

    private manuallyFilterDatabase(): void {
        this.useProteomeFilter = false;
        this.currentStep = 3;

    }

    private filterByProteomes(): void {
        this.useProteomeFilter = true;
        this.currentStep = 3;
    }

    private validateDatabaseSourcesAndContinue(): void {
        // @ts-ignore
        if (this.$refs.databaseSourcesForm.validate()) {
            this.currentStep = 4;
        }
    }

    private async addReferenceProteome(): Promise<void> {
        this.referenceProteomeError = "";
        try {
            const proteome = await ProteomeCommunicator.getProteomeById(this.referenceProteome);
            if (proteome === null) {
                this.referenceProteomeError = "This proteome does not exist.";
            } else if (this.referenceProteomes.some(p => p.id === proteome.id)) {
                this.referenceProteomeError = "This proteome is already added.";
            } else {
                this.referenceProteomes.push(proteome);
                this.referenceProteome = "";
            }
        } catch (e) {
            this.referenceProteomeError = e.message;
        }
    }

    private removeReferenceProteome(idx: number): void {
        this.referenceProteomes.splice(idx, 1);
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
                convertedSources.map(s => UniProtConstants.SOURCE_URLS[s]),
                this.selectedTaxa.map(taxon => taxon.id),
                this.selectedVersion
            ]
        );
        this.dialogActive = false;

        // After a database construction was started, we need to reset this wizard and prepare it for the next user.
        this.resetWizard();
    }

    private async buildDatabaseFromReferenceProteomes(): Promise<void> {
        this.$store.dispatch(
            "customDatabases/buildDatabase",
            [
                this.databaseName,
                this.referenceProteomes.map(p => p.id),
                this.referenceProteomes.map(
                    p => `https://rest.uniprot.org/uniprotkb/stream?compressed=true\\&format=xml\\&query=\\(\\(proteome:${p.id}\\)\\)`
                ),
                // No filtering should be applied in this case
                [1],
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
        (this.$refs.databaseNameForm as any).reset();
        if (this.$refs.databaseSourcesForm) {
            (this.$refs.databaseSourcesForm as any).reset();
        }
        this.selectedSources.splice(0, this.selectedSources.length);
        this.selectedSources.push(...this.sources);
        this.selectedVersion = this.sources[0];
        this.selectedMirror = "EU (Expasy)";
        this.referenceProteome = "";
        this.referenceProteomes.splice(0, this.referenceProteomes.length);
        this.referenceProteomeError = "";
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
    private async onValueChanged(): Promise<void> {
        if (this.value) {
            // Reset to the default supplied values.
            if (this.databaseNameDefault !== "") {
                if (
                    this.selectedSourcesDefault.includes("trembl") ||
                    this.selectedSourcesDefault.includes("swissprot")
                ) {
                    this.useProteomeFilter = false;
                } else {
                    this.referenceProteomes.splice(0, this.referenceProteomes.length);
                    for (const proteomeId of this.selectedSourcesDefault) {
                        this.referenceProteomes.push(await ProteomeCommunicator.getProteomeById(proteomeId));
                    }

                    this.useProteomeFilter = true;
                }
            }

            this.selectedSources.splice(0, this.selectedSources.length);
            this.selectedSources.push(...this.selectedSourcesDefault.map(
                (x: string) => {
                    const translationTable = { "trembl": "TrEMBL", "swissprot": "SwissProt" };
                    if (x in translationTable) {
                        return translationTable[x];
                    } else {
                        return x;
                    }
                }
            ));
            this.databaseName = this.databaseNameDefault;
            // this.selectedVersion = this.selectedVersionDefault;
            this.selectedTaxa.splice(0, this.selectedTaxa.length);
            this.selectedTaxa.push(...this.selectedTaxaDefault);

            if (
                this.selectedSourcesDefault.includes("trembl") ||
                this.selectedSourcesDefault.includes("swissprot")
            ) {
                await this.$nextTick();
                this.currentStep = 4;
            } else {
                this.currentStep = 3;
            }
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
