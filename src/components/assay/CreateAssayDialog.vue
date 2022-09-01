<template>
    <v-dialog v-model="dialogActive" max-width="1400">
        <v-card>
            <v-card-title>
                Create assays
                <v-spacer></v-spacer>
                <v-btn icon @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-card-text>
                <v-alert v-model="errorActive" type="error" prominent text dismissible>
                    <span v-html="errorMessage"></span>
                </v-alert>

                <p>
                    Create one or more assays and modify their search configuration using the settings below.
                </p>

                <v-data-table
                    :items="assayPlaceholders"
                    :headers="assayCreationTableHeaders"
                    show-expand
                    :expanded.sync="expandedItems"
                    item-key="id"
                    class="assayCreationTable">
                    <template v-slot:item.data-table-expand="{ item, isExpanded, expand }">
                        <v-progress-circular v-if="item.inProgress" indeterminate></v-progress-circular>
                        <v-btn v-else @click="expand(!isExpanded)" icon>
                            <v-icon v-if="isExpanded">mdi-chevron-up</v-icon>
                            <v-icon v-else>mdi-chevron-down</v-icon>
                        </v-btn>
                    </template>
                    <template v-slot:header.equateIl="{ header }">
                        {{ header.text }}
                        <div v-if="assayPlaceholders.length > 0">
                            <a v-if="areAllEquateIl" @click="areAllEquateIl = false">
                                Uncheck all
                            </a>
                            <a v-else @click="areAllEquateIl = true">
                                Check all
                            </a>
                        </div>
                    </template>
                    <template v-slot:header.filterDuplicates="{ header }">
                        {{ header.text }}
                        <div v-if="assayPlaceholders.length > 0">
                            <a v-if="areAllFilterDuplicate" @click="areAllFilterDuplicate = false">
                                Uncheck all
                            </a>
                            <a v-else @click="areAllFilterDuplicate = true">
                                Check all
                            </a>
                        </div>
                    </template>
                    <template v-slot:header.missedCleavage="{ header }">
                        <v-tooltip bottom open-delay="500">
                            <template v-slot:activator="{ on }">
                                <span v-on="on" class="underlined-info">
                                    {{ header.text }}
                                    <v-icon x-small>mdi-information-outline</v-icon>
                                </span>
                            </template>
                            <span>
                                Enabling this setting has a serious performance impact and could lead to slower
                                analyses.
                            </span>
                        </v-tooltip>

                        <div v-if="assayPlaceholders.length > 0">
                            <a v-if="areAllMissedCleavage" @click="areAllMissedCleavage = false">
                                Uncheck all
                            </a>
                            <a v-else @click="areAllMissedCleavage = true">
                                Check all
                            </a>
                        </div>
                    </template>
                    <template v-slot:header.analysisSource="{ header }">
                        {{ header.text }}
                        <v-edit-dialog
                            v-if="assayPlaceholders.length > 0"
                            large
                            save-text="Update all"
                            @save="setGlobalAnalysisSource">
                            <a>Update all</a>
                            <template v-slot:input>
                                <analysis-source-select
                                    v-model="globalSourceSelection"
                                    :items="renderableSources"
                                    class="my-6">
                                </analysis-source-select>
                            </template>
                        </v-edit-dialog>
                    </template>
                    <template v-slot:item.name="props">
                        <v-text-field
                            v-model="props.item.name"
                            hide-details
                            dense
                            :error-messages="props.item.nameError">
                        </v-text-field>
                    </template>
                    <template v-slot:item.equateIl="{ item }">
                        <v-simple-checkbox v-model="item.searchConfiguration.equateIl" color="primary">
                        </v-simple-checkbox>
                    </template>
                    <template v-slot:item.filterDuplicates="{ item }">
                        <v-simple-checkbox v-model="item.searchConfiguration.filterDuplicates" color="primary">
                        </v-simple-checkbox>
                    </template>
                    <template v-slot:item.missedCleavage="{ item }">
                        <v-simple-checkbox v-model="item.searchConfiguration.enableMissingCleavageHandling" color="primary">
                        </v-simple-checkbox>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-tooltip bottom open-delay="500">
                            <template v-slot:activator="{ on }">
                                <v-btn icon v-on="on" color="red" @click="removeAssayConfirmationActive = true">
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </template>
                            <span>Delete assay</span>
                        </v-tooltip>
                        <confirm-deletion-dialog
                            v-model="removeAssayConfirmationActive"
                            :action="() => deleteAssay(item)"
                            item-type="assay">
                        </confirm-deletion-dialog>
                    </template>
                    <template v-slot:item.peptides="{ item }">
                        {{ item.peptides.trim().split("\n").length }}
                    </template>
                    <template v-slot:item.analysisSource="{ item }">
                        <analysis-source-select
                            :items="renderableSources"
                            v-model="item.analysisSource"
                            :error-messages="item.analysisSourceError">
                        </analysis-source-select>
                    </template>
                    <template v-slot:expanded-item="{ headers, item }">
                        <td :colspan="headers.length">
                            <div class="my-4">
                                <v-row>
                                    <v-col :cols="6">
                                        <div class="font-weight-bold">
                                            Add peptides that should be analysed to the textarea below.
                                        </div>
                                        <v-textarea
                                            v-model="item.peptides"
                                            label="Peptides"
                                            counter>
                                            <template v-slot:counter>
                                                <div class="v-counter theme--light">
                                                    {{ (item.peptides.trim().match(/\n/g) || []).length + (item.peptides.trim() === "" ? 0 : 1) }} peptides
                                                </div>
                                            </template>
                                        </v-textarea>
                                    </v-col>
                                    <v-divider vertical></v-divider>
                                    <v-col :cols="6">
                                        <div class="d-flex flex-column align-center">
                                            <div class="font-weight-bold">
                                                Or, import peptides from a file...
                                            </div>
                                            <v-btn class="mt-2" @click="importPeptidesFromFile(item)">
                                                Import from file
                                            </v-btn>
                                        </div>
                                    </v-col>
                                </v-row>
                            </div>
                        </td>
                    </template>
                    <template v-slot:body.append="{ headers }">
                        <td :colspan="headers.length">
                            <div class="d-flex justify-center my-2">
                                <v-menu>
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn text color="primary" v-on="on">
                                            <v-icon>mdi-plus</v-icon>
                                            Add assay
                                        </v-btn>
                                    </template>
                                    <v-list>
                                        <v-list-item @click="addAssayEntry">
                                            <v-list-item-title>Empty assay</v-list-item-title>
                                        </v-list-item>
                                        <v-list-item @click="importAssaysFromFile">
                                            <v-list-item-title>Bulk import from file(s)</v-list-item-title>
                                        </v-list-item>
                                    </v-list>
                                </v-menu>
                            </div>
                        </td>
                    </template>
                </v-data-table>

                <div class="d-flex justify-center mt-4">
                    <v-btn @click="close" class="mr-2">
                        Cancel
                    </v-btn>
                    <v-btn color="primary" @click="addToProject" :disabled="assayPlaceholders.length === 0">
                        Continue
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Watch } from "vue-property-decorator";
import Component from "vue-class-component";
import {
    Study,
    Peptide,
    AnalysisSource,
    SearchConfiguration,
    ProteomicsAssay, OnlineAnalysisSource
} from "unipept-web-components";
import { promises as fs } from "fs";
import { isText } from "istextorbinary";
import path from "path";
import AnalysisSourceSelect, { RenderableAnalysisSource } from "@/components/assay/AnalysisSourceSelect.vue";
import { v4 as uuidv4 } from "uuid";
import CachedOnlineAnalysisSource from "@/logic/communication/analysis/CachedOnlineAnalysisSource";
import CachedCustomDbAnalysisSource from "@/logic/communication/analysis/CachedCustomDbAnalysisSource";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import ConfirmDeletionDialog from "@/components/dialogs/ConfirmDeletionDialog.vue";


const { dialog } = require("@electron/remote");

type ProteomicsAssayPlaceholder = {
    id: number,
    name: string,
    // Error that should be shown in the name field for this assay.
    nameError: string,
    peptides: string,
    analysisSource: RenderableAnalysisSource,
    // Error that should be shown in the assay source selection for this assay.
    analysisSourceError: string,
    searchConfiguration: SearchConfiguration,
    // Are the peptides for this assay currently being read from the filesystem by this application?
    inProgress: boolean
}

@Component({
    components: { ConfirmDeletionDialog, AnalysisSourceSelect }
})
export default class CreateAssayDialog extends Vue {
    @Prop({ required: true })
    private value: boolean;
    @Prop({ required: true })
    private study: Study;

    private dialogActive: boolean = false;

    private idCounter: number = 0;

    private renderableSources: RenderableAnalysisSource[] = [];
    private globalSourceSelection: RenderableAnalysisSource = null;

    private removeAssayConfirmationActive: boolean = false;

    private errorActive: boolean = false;
    private errorMessage: string = "";

    // The previous directory that was used to load an assay from.
    // (Is required to open the file dialog in the same directory on Linux)
    private previousDirectory: string = undefined;

    private assayPlaceholders: ProteomicsAssayPlaceholder[] = [];
    private expandedItems: ProteomicsAssayPlaceholder[] = [];
    private assayCreationTableHeaders = [
        {
            text: "Assay name",
            align: "start",
            sortable: true,
            value: "name",
            width: "17%"
        }, {
            text: "Equate I/L",
            align: "center",
            sortable: false,
            value: "equateIl",
            width: "12%"
        }, {
            text: "Filter duplicates",
            align: "center",
            sortable: false,
            value: "filterDuplicates",
            width: "13%"
        }, {
            text: "Advanced missed cleavages",
            align: "center",
            sortable: false,
            value: "missedCleavage",
            width: "20%"
        }, {
            text: "Analysis source",
            align: "center",
            sortable: false,
            value: "analysisSource",
            width: "22%"
        }, {
            text: "Peptides",
            align: "center",
            sortable: false,
            value: "peptides",
            width: "5%"
        }, {
            text: "Delete",
            align: "center",
            sortable: false,
            value: "actions",
            width: "10%"
        }
    ];

    get areAllEquateIl(): boolean {
        return this.assayPlaceholders.every((item: ProteomicsAssayPlaceholder) => item.searchConfiguration.equateIl);
    }

    set areAllEquateIl(value: boolean) {
        for (const item of this.assayPlaceholders) {
            item.searchConfiguration.equateIl = value;
        }
    }

    get areAllFilterDuplicate(): boolean {
        return this.assayPlaceholders.every(
            (item: ProteomicsAssayPlaceholder) => item.searchConfiguration.filterDuplicates
        );
    }

    set areAllFilterDuplicate(value: boolean) {
        for (const item of this.assayPlaceholders) {
            item.searchConfiguration.filterDuplicates = value;
        }
    }

    get areAllMissedCleavage(): boolean {
        return this.assayPlaceholders.every(
            (item: ProteomicsAssayPlaceholder) => item.searchConfiguration.enableMissingCleavageHandling
        );
    }

    set areAllMissedCleavage(value: boolean) {
        for (const item of this.assayPlaceholders) {
            item.searchConfiguration.enableMissingCleavageHandling = value;
        }
    }

    private created() {
        // Reset the current state of the component when it is reopened.
        this.renderableSources.push({
            type: "online",
            title: "Online Unipept service",
            subtitle: "https://rick.ugent.be"
        });

        for (const dbInfo of (this.$store.getters["customDatabases/databases"] as CustomDatabase[])) {
            if (dbInfo.ready) {
                this.renderableSources.push({
                    type: "local",
                    title: dbInfo.name,
                    subtitle: `${dbInfo.entries} UniProtKB-entries`
                });
            }
        }
    }

    @Watch("value")
    private async onValueChanged() {
        // Reset the status of the dialog when it is opened again.
        if (this.value) {
            this.assayPlaceholders.splice(0, this.assayPlaceholders.length);
        }
        this.errorActive = false;
        this.errorMessage = "";

        this.dialogActive = this.value;
    }

    private close() {
        this.dialogActive = false;
        this.$emit("input", this.dialogActive);
    }

    /**
     * Validate the inputs that are provided by the user and create a new ProteomicsAssay for each of the input entries.
     * The dialog will not be closed and the user will be notified of any conflicts if the validation fails. Otherwise
     * all of the entries will be added to the store to be processed and the dialog will automatically close.
     */
    private async addToProject() {
        if (this.validate()) {
            const failedToWrite: ProteomicsAssay[] = [];
            const constructedAssays: ProteomicsAssay[] = [];

            // Create assays for each placeholder and add them to the store to be processed.
            for (const placeholder of this.assayPlaceholders) {
                const assay = new ProteomicsAssay(uuidv4());

                this.study.addAssay(assay);

                assay.setName(placeholder.name);
                assay.setPeptides(placeholder.peptides.split(/\r?\n/g));
                assay.setSearchConfiguration(placeholder.searchConfiguration);

                let analysisSource: AnalysisSource;
                if (placeholder.analysisSource.type === "online") {
                    analysisSource = new CachedOnlineAnalysisSource(
                        placeholder.analysisSource.subtitle,
                        assay,
                        this.$store.getters.dbManager,
                        this.$store.getters.projectLocation,
                        this.$store
                    );
                } else {
                    const configMng = new ConfigurationManager();
                    const config = await configMng.readConfiguration();

                    analysisSource = new CachedCustomDbAnalysisSource(
                        assay,
                        this.$store.getters.dbManager,
                        this.$store.getters["customDatabases/database"](placeholder.analysisSource.title),
                        config.customDbStorageLocation,
                        this.$store.getters.projectLocation,
                        this.$store
                    );
                }

                assay.setAnalysisSource(analysisSource);

                try {
                    // Write assay to filesystem
                    const assayFileWriter = new AssayFileSystemDataWriter(
                        `${this.$store.getters.projectLocation}/${this.study.getName()}`,
                        this.$store.getters.dbManager,
                        this.study,
                        this.$store.getters.projectLocation,
                        this.$store
                    );
                    await assay.accept(assayFileWriter);
                } catch (err) {
                    console.error(err);
                    failedToWrite.push(assay);
                }

                constructedAssays.push(assay);
            }

            if (failedToWrite.length === 0) {
                // Start processing all of the given assays.
                for (const assay of constructedAssays) {
                    await this.$store.dispatch("addAssay", assay);
                }

                this.close();
            } else {
                this.errorMessage =
                    `
                    The application was unable to write the following assays to disk:
                    <span class="font-weight-bold">${failedToWrite.map(a => a.getName()).join(", ")}</span>. Please
                    try again later. Make sure that the filesystem you're are trying to access is writeable.
                    `;
                this.errorActive = true;
            }
        }
    }

    /**
     * Check the provided values for all of the entries in the table. If one of the provided values conflicts with the
     * expected data, an appropriate error message in the corresponding field will be set.
     *
     * @return true if the validation succeeds, false if a conflict is discovered.
     */
    private validate(): boolean {
        let valid: boolean = true;
        for (const placeholder of this.assayPlaceholders) {
            // First reset the current validation status.
            placeholder.analysisSourceError = "";
            placeholder.nameError = "";

            if (placeholder.inProgress) {
                valid = false;
                this.errorMessage =
                    `
                    Not all selected input files are read yet. Please wait for all files to be processed before
                    continuing.
                    `;
            }

            if (!placeholder.analysisSource) {
                placeholder.analysisSourceError = "An analysis source is required!";
                valid = false;
            }

            if (!placeholder.name) {
                placeholder.nameError = "A name is required!";
                valid = false;
            } else if (
                this.assayPlaceholders
                    .map(a => a.name)
                    .concat(this.study.getAssays().map(a => a.getName()))
                    .filter(name => name === placeholder.name).length > 1
            ) {
                placeholder.nameError = "This name is already in use. Choose another name for this assay.";
                valid = false;
            }
        }

        this.errorMessage =
            `
            Some of the entries you've provided are invalid. Please fix the errors in the table below (indicated in red)
            before continuing. Make sure that you've provided a valid analysis source for each entry and that all assays
            have a unique name.
            `;
        this.errorActive = !valid;

        return valid;
    }

    private deleteAssay(item: ProteomicsAssayPlaceholder) {
        this.removeAssayConfirmationActive = false;
        const idx = this.assayPlaceholders.findIndex((a: ProteomicsAssayPlaceholder) => a.id === item.id);
        if (idx >= 0) {
            this.assayPlaceholders.splice(idx, 1);
        }
    }

    private addAssayEntry() {
        const assayPlaceholder: ProteomicsAssayPlaceholder = {
            id: this.idCounter++,
            name: this.generateUniqueAssayName("New assay"),
            nameError: "",
            peptides: "",
            searchConfiguration: new SearchConfiguration(),
            analysisSource: this.renderableSources[0],
            analysisSourceError: "",
            inProgress: false
        }
        this.assayPlaceholders.push(assayPlaceholder);
        this.expandedItems.push(assayPlaceholder);
    }

    private async importAssaysFromFile() {
        const incompatibleFiles: string[] = [];

        const chosenPath: Electron.OpenDialogReturnValue | undefined = await dialog.showOpenDialog({
            properties: ["openFile", "multiSelections"],
            defaultPath: this.previousDirectory
        });

        for (const filePath of chosenPath["filePaths"]) {
            if (filePath.endsWith(".pep") || isText(filePath)) {
                let assayName = path.basename(filePath).replace(/\.[^/.]+$/, "");
                assayName = this.generateUniqueAssayName(assayName);

                const assayPlaceHolder: ProteomicsAssayPlaceholder = {
                    id: this.idCounter++,
                    name: assayName,
                    nameError: "",
                    peptides: "",
                    searchConfiguration: new SearchConfiguration(),
                    analysisSource: this.renderableSources[0],
                    analysisSourceError: "",
                    inProgress: true
                };

                this.assayPlaceholders.push(assayPlaceHolder)

                assayPlaceHolder.peptides = await fs.readFile(filePath, "utf-8");
                assayPlaceHolder.inProgress = false;
            } else {
                incompatibleFiles.push(path.basename(filePath));
            }
        }

        this.errorMessage =
            `
            Some of the files you provided are incompatible with this application. Only text-based files that
            contain one peptide per line are allowed. The following files are incompatible:
            <strong>${ incompatibleFiles.join(", ") }</strong>.
            `
        this.errorActive = incompatibleFiles.length > 0;
    }

    private async importPeptidesFromFile(item: ProteomicsAssayPlaceholder): Promise<void> {
        const chosenPath: Electron.OpenDialogReturnValue | undefined = await dialog.showOpenDialog({
            properties: ["openFile"],
            defaultPath: this.previousDirectory
        });

        if (chosenPath && chosenPath["filePaths"].length > 0) {
            const path = chosenPath["filePaths"][0];
            item.peptides = await fs.readFile(path, "utf-8");
        }
    }

    /**
     * Update the analysis source for all placeholder items that are currently created by the user. Previous choices for
     * the analysis source will be overwritten and cannot be recovered.
     */
    private setGlobalAnalysisSource() {
        for (const assay of this.assayPlaceholders) {
            assay.analysisSource = this.globalSourceSelection;
        }
    }

    /**
     * Check to see if an assay with the requested name already exists for this study. If this is the case, a counter
     * will be added to the requestedName making it unique. The counter will be incremented until the name is completely
     * unique.
     *
     * @param requestedName Assay name that we are trying to make unique by adding a counter.
     */
    private generateUniqueAssayName(requestedName: string): string {
        // Check if assay with same name already exists in the list of assays for this study. If so, change the name
        // to make it unique.
        let otherAssayWithName = this.study.getAssays()
            .map(a => a.getName())
            .concat(this.assayPlaceholders.map(p => p.name))
            .find(name => name === requestedName);

        if (otherAssayWithName) {
            // Append a number to the assay to make it unique. An assay with this name might again already exist, which
            // is why we need to check for uniqueness in a loop.
            let counter = 1;
            let newName: string;
            while (otherAssayWithName) {
                newName = `${requestedName} (${counter})`;
                otherAssayWithName = this.study.getAssays()
                    .map(a => a.getName())
                    .concat(this.assayPlaceholders.map(p => p.name))
                    .find(name => name === newName);
                counter++;
            }
            requestedName = newName;
        }
        return requestedName;
    }
}
</script>

<style>
    /* Make sure that appended row in the data table is not highlighted when hovered. */
    .plain-table-row:hover {
        background-color: white !important;
    }

    .underlined-info {
        text-decoration: underline;
        text-underline-position: under;
        text-decoration-style: dashed;
    }
</style>
