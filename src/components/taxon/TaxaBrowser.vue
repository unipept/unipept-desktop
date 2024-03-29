<template>
    <div>
        <div class="mb-4">
            <div class="d-flex align-center">
                <div class="flex-grow-1">
                    <h3>Taxa selected for filtering</h3>
                    <div class="text-caption">
                        Only UniProtKB-records that are associated with an organism that is a child of one of these chosen
                        taxa will be retained in the resulting database.
                    </div>
                </div>
                <div>
                    <v-tooltip bottom open-delay="500">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                color="primary"
                                v-on="on"
                                @click="importTaxaFromFile"
                                :loading="importLoading"
                                class="ml-2"
                                small>
                                Import taxa from file
                            </v-btn>
                        </template>
                        <span>Import a selection of taxa for filtering from a file.</span>
                    </v-tooltip>
                </div>
            </div>
            <div class="my-2">
                <!-- This error is shown whenever the complete taxa import file could not be read properly -->
                <div v-if="parseError">
                    <v-alert type="error" text dismissible @input="parseError = false">
                        An error occurred while trying to parse the file you provided. Make sure that this is a valid
                        text file that contains one NCBI taxon ID per line and the filesystem is readable.
                    </v-alert>
                </div>
                <!-- This error is shown when not all the selected taxa for the import could be processed.-->
                <div v-else-if="importWarning">
                    <v-alert type="warning" text dismissible @input="importWarning = false">
                        Warning: the following NCBI ID's were not found and could not be imported:
                        {{ failedImports.join(", ") }}.
                    </v-alert>
                </div>

                <v-container fluid>
                    <v-row>
                        <div style="width: 100%;">
                            <div class="d-flex align-center">
                                <div v-if="selectedItems.length === 0" style="text-align: center; width: 100%;">
                                    <div>No taxa selected yet. No filtering will be applied.</div>
                                    <div class="text-caption">
                                        Use the table and search bar below to find taxa that can be used for filtering.
                                    </div>
                                </div>
                                <v-chip-group v-else column class="flex-grow-1">
                                    <v-chip
                                        v-for="taxon in selectedItems"
                                        close
                                        :key="taxon.id"
                                        @click:close="selectItem(taxon)"
                                        :color="getRankColor(taxon.rank)"
                                        dark>
                                        {{ taxon.name }}
                                    </v-chip>
                                </v-chip-group>
                                <v-tooltip bottom open-delay="500">
                                    <template v-slot:activator="{ on, attrs }">
                                        <v-btn
                                            class="align-self-start"
                                            v-on="on"
                                            @click="clearSelection()"
                                            small
                                            outlined
                                            color="error"
                                            :disabled="selectedItems.length === 0">
                                           Clear all
                                        </v-btn>
                                    </template>
                                    <span>Clear selection</span>
                                </v-tooltip>
                            </div>
                            <v-divider></v-divider>
                        </div>
                    </v-row>
                    <v-row>
                        <div>
                            <span v-if="uniprotRecordsHelper.isExecuting()">Computing database size...</span>
                            <span v-else>
                                Resulting database will contain {{ formattedUniprotRecords }} UniProtKB records.
                            </span>
                        </div>
                    </v-row>
                </v-container>
            </div>
        </div>
        <div>
            <v-data-table
                :headers="headers"
                :items="taxa"
                :items-per-page="5"
                :server-items-length="taxaCount"
                :loading="loading"
                :options.sync="options"
                dense>
                <template v-slot:footer.prepend>
                    <v-text-field
                        prepend-icon="mdi-magnify"
                        label="Search"
                        v-model="search"
                        append-icon="mdi-close"
                        dense
                        hide-details
                        class="mr-6"
                        @keydown.enter="filterByName()"
                        @click:append="clearFilter()">
                    </v-text-field>
                </template>
                <template v-slot:item.action="{ item }">
                    <v-btn
                        color="primary"
                        x-small
                        text
                        @click="selectItem(item)"
                        :disabled="isParentOrSelfSelected(item)">
                        <v-icon x-small>mdi-plus</v-icon>
                        Add
                    </v-btn>
                </template>
                <template v-slot:item.rank="{ item }">
                    <div class="d-flex align-center">
                        <div
                            style="height: 10px; width: 10px; border-radius: 50%;"
                            :class="`mr-2 ${getRankColor(item.rank)}`">
                        </div>
                        <div>{{ item.rank }}</div>
                    </div>
                </template>
            </v-data-table>
        </div>
        <div class="text-caption mb-2">
            <span>Hint:</span>
            enter a keyword to search for taxa. You can search by name, NCBI identifier or rank.
            <v-tooltip bottom open-delay="500">
                <template v-slot:activator="{ on, attrs }">
                    <a @click="showSearchHintActive = !showSearchHintActive" v-on="on">
                        Advanced search capabilities
                    </a>
                </template>
                <span>Click to toggle search hints.</span>
            </v-tooltip>
            are available.
        </div>
        <div class="text-caption" v-if="showSearchHintActive">
            Some examples of what you can do:
            <ul>
                <li>
                    Look for all taxa with a specific rank:
                    <span class="inline-code">rank_name:(species)</span>
                </li>
                <li>
                    Look for all taxa whose name contains the words "severe" and "acute":
                    <span class="inline-code">name:(severe acute)</span>
                </li>
                <li>
                    Look for all taxa that are assigned the "species" rank and whose name contains "bacteria":
                    <span class="inline-code">rank_name:(species) AND name:(bacteria)</span>
                </li>
                <li>
                    Look for all taxa whose ID starts with "1234" or whose name contains "1234":
                    <span class="inline-code">id:(^1234*) OR name:(1234)</span>
                </li>
                <li>
                    Look for all "Escherichia Coli" by using it's abbreviation:
                    <span class="inline-code">e* coli</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
    NcbiId,
    NcbiOntologyProcessor,
    NcbiRank,
    NcbiTaxon,
    Ontology,
    StringUtils
} from "unipept-web-components";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import { Prop, Watch } from "vue-property-decorator";
import { DataOptions } from "vuetify";
import { promises as fs } from "fs";
import MetadataCommunicator from "@/logic/communication/metadata/MetadataCommunicator";
import AsyncHelper from "@/logic/AsyncHelper";

const { dialog } = require("@electron/remote");

@Component
export default class TaxaBrowser extends Vue {
    @Prop({ required: true })
    private swissprotSelected: boolean;
    @Prop({ required: true })
    private tremblSelected: boolean;
    @Prop({ required: true })
    private value: NcbiTaxon[];

    private headers = [
        {
            text: "NCBI ID",
            align: "start",
            value: "id",
            width: "15%"
        },
        {
            text: "Name",
            align: "start",
            value: "name",
            width: "45%"
        },
        {
            text: "Rank Name",
            align: "start",
            value: "rank",
            width: "38%"
        },
        {
            text: "",
            align: "left",
            value: "action",
            width: "2%",
            sortable: false
        }
    ];

    private rankColors: string[] = [
        "red",
        "red darken-4",
        "pink",
        "pink darken-4",
        "purple",
        "purple darken-4",
        "deep-purple",
        "deep-purple darken-4",
        "indigo",
        "indigo darken-4",
        "blue",
        "blue darken-4",
        "light-blue",
        "light-blue darken-4",
        "cyan",
        "cyan darken-4",
        "teal",
        "teal darken-4",
        "green",
        "green darken-4",
        "light-green",
        "light-green darken 4",
        "lime darken-1",
        "lime darken-4",
        "amber",
        "amber darken-4",
        "orange",
        "orange darken-4",
        "deep-orange",
        "deep-orange darken-4"
    ];

    private search = "";

    private taxaCount = 0;
    private taxa: NcbiTaxon[] = [];

    private loading = true;

    private filterLoading = false;

    private importLoading = false;

    private parseError = false;
    private importWarning = false;
    // List of taxon identifiers that could not be imported properly
    private failedImports: string[] = []

    // @ts-ignore
    private options: DataOptions = {};

    private ncbiCommunicator: CachedNcbiResponseCommunicator;
    private ncbiOntologyProcessor: NcbiOntologyProcessor;

    private selectedItems: NcbiTaxon[] = [];

    private showSearchHintActive = false;

    private uniprotRecords = 0;
    private uniprotRecordsHelper = new AsyncHelper<number>();

    private get formattedUniprotRecords(): string {
        return StringUtils.toHumanReadableNumber(this.uniprotRecords);
    }

    private mounted() {
        this.loading = true;
        this.onValueChanged();
        this.ncbiCommunicator = new CachedNcbiResponseCommunicator();
        this.ncbiOntologyProcessor = new NcbiOntologyProcessor(this.ncbiCommunicator);
        this.taxaCount = this.ncbiCommunicator.getNcbiCount();
        this.loading = false;
        this.computeUniprotRecords();
    }

    private clearSelection(): void {
        this.selectedItems.splice(0, this.selectedItems.length);
    }

    private async clearFilter(): Promise<void> {
        this.search = "";
        await this.filterByName();
    }

    private async filterByName(): Promise<void> {
        this.filterLoading = true;
        this.taxaCount = this.ncbiCommunicator.getNcbiCount(
            this.search
        );
        this.options.page = 1;
        await this.onOptionsChanged();
        this.filterLoading = false;
    }

    @Watch("value")
    private onValueChanged() {
        if (this.value !== this.selectedItems) {
            this.selectedItems.splice(0, this.selectedItems.length);
            this.selectedItems.push(...this.value);
        }
    }

    @Watch("options")
    private async onOptionsChanged(): Promise<void> {
        if (this.ncbiOntologyProcessor && !this.loading) {
            const { sortBy, sortDesc, page, itemsPerPage } = this.options;

            const ncbis = this.ncbiCommunicator.getNcbiRange(
                itemsPerPage * (page - 1),
                itemsPerPage * page,
                this.search,
                (sortBy.length > 0 ? sortBy[0] : undefined) as "id" | "name" | "rank",
                sortDesc.length > 0 ? sortDesc[0] : undefined
            );

            const ontology: Ontology<NcbiId, NcbiTaxon> = await this.ncbiOntologyProcessor.getOntologyByIds(
                ncbis, false
            );

            this.taxa.splice(0, this.taxa.length);
            this.taxa.push(...ontology.toMap().values());
        }
    }

    @Watch("selectedItems")
    @Watch("swissprotSelected")
    @Watch("tremblSelected")
    private onSelectedItemsChanged(): void {
        this.$emit("input", this.selectedItems);
        this.computeUniprotRecords();
    }

    private async computeUniprotRecords(): Promise<void> {
        this.uniprotRecordsHelper.performIfLast(
            () => MetadataCommunicator.getUniProtRecordCount(
                this.selectedItems.map(taxon => taxon.id),
                this.swissprotSelected,
                this.tremblSelected
            ),
            (count) => {
                this.uniprotRecords = count;
            }
        );
    }

    private getRankColor(rank: string): string {
        const idx = Object.values(NcbiRank).findIndex(r => r === rank);
        return this.rankColors[idx % this.rankColors.length];
    }

    private selectItem(item: NcbiTaxon): void {
        const idx = this.selectedItems.findIndex(element => element.id === item.id);
        if (idx === -1) {
            this.selectedItems.push(item);
        } else {
            this.selectedItems.splice(idx, 1);
        }
    }

    /**
     * This function will detect whether the given taxon is already directly or indirectly selected. It can be
     * indirectly selected through one of the other items if this taxon is a child in the NCBI taxonomy of one of
     * those already selected taxa.
     *
     * @param item The taxon for which we want to find out if it is already selected or not.
     */
    private isParentOrSelfSelected(item: NcbiTaxon): boolean {
        if (this.selectedItems.find(t => t.id === item.id)) {
            return true;
        }

        return this.selectedItems.some(t => item.lineage.includes(t.id));
    }

    private async importTaxaFromFile(): Promise<void> {
        this.importLoading = true;
        this.importWarning = false;
        this.parseError = false;

        try {
            const chosenPath: Electron.OpenDialogReturnValue | undefined = await dialog.showOpenDialog({
                properties: ["openFile"]
            });

            for (const path of chosenPath["filePaths"]) {
                const content = await fs.readFile(path, "utf-8");
                const lines = content.split("\n").map(l => l.trimEnd()).filter(l => l !== "");

                if (!lines.every(l => /^[0-9]*$/.test(l))) {
                    this.parseError = true;
                    this.importLoading = false;
                    return;
                }

                const taxaIds = lines.map(l => Number.parseInt(l));

                const ontology: Ontology<NcbiId, NcbiTaxon> = await this.ncbiOntologyProcessor.getOntologyByIds(
                    taxaIds
                );

                for (const taxon of taxaIds.map(id => ontology.getDefinition(id)).filter(t => t)) {
                    // For each item we need to check if it already occurs in the selected items. If we perform this
                    // check for every item from the file that needs to be imported, we can also make sure that no
                    // doubles are inserted into the list.
                    if (this.selectedItems.filter(x => x.id === taxon.id).length === 0) {
                        this.selectedItems.push(taxon);
                    }
                }

                this.failedImports.splice(0, this.failedImports.length);
                this.failedImports.push(...taxaIds.filter(id => !ontology.getDefinition(id)).map(x => x.toString()));
                if (this.failedImports.length > 0) {
                    this.importWarning = true;
                }
            }
        } catch (e) {
            this.parseError = true;
            console.error(e);
        }

        this.importLoading = false;
    }
}
</script>

<style scoped>
    .inline-code {
        background-color: #eee;
        font-family: Roboto mono, monospace;
    }
</style>
