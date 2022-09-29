<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <div style="max-width: 1400px; margin: auto;">
                    <h2 class="mx-auto settings-category-title">Custom databases</h2>
                    <v-card>
                        <v-card-text>
                            <v-alert type="error" prominent text v-if="dockerConnectionError">
                                Could not connect to the Docker daemon. Make sure that all
                                <router-link to="/settings">connection settings</router-link> are properly configured
                                before building a database.
                            </v-alert>

                            <v-alert type="error" prominent text v-if="dbFolderError">
                                The specified database folder does not exist (or the provided path is not a folder).
                                Make sure that all <router-link to="/settings">settings</router-link> are properly
                                configured before building a database.
                            </v-alert>

                            <v-alert type="warning" prominent text v-if="lowOnMemoryWarning">
                                <div>
                                    Warning: not enough memory
                                    ({{ (availableMemoryAmount / (1024 ** 3)).toFixed(2) }} GiB) has been allocated to
                                    the Docker daemon. You could try and continue to build a database, but the database
                                    construction process could fail. Make sure that at least 6 GiB of memory is
                                    available for the Docker daemon.
                                </div>
                            </v-alert>

                            <div>
                                Below you can find a list of all custom databases that are currently registered to this
                                application. To create a new custom database, press the floating button in the lower
                                right corner. A wizard will guide you through the custom database construction process.
                            </div>
                            <v-data-table
                                :headers="headers"
                                show-expand
                                :expanded.sync="expandedItems"
                                :items="databases"
                                item-key="name"
                                :loading="loading">
                                <template v-slot:item.taxa="{ item }">
                                    <span v-if="loading">
                                        Loading...
                                    </span>
                                    <div v-else class="taxa-filter">
                                        {{
                                            item.taxa
                                                .map(t => ncbiOntology.getDefinition(t))
                                                .filter(i => i !== undefined)
                                                .map(i => i.name)
                                                .join(", ")
                                        }}
                                    </div>
                                </template>
                                <template v-slot:item.entries="{ item }">
                                    <span v-if="item.entries === -1">N/A</span>
                                    <span v-else>{{ toHumanReadableNumber(item.entries) }}</span>
                                </template>
                                <template v-slot:item.sizeOnDisk="{ item }">
                                    <span v-if="item.sizeOnDisk === -1">
                                        N/A
                                    </span>
                                    <span v-else>
                                        {{
                                            toHumanReadableNumber(Math.round(item.sizeOnDisk / 1024 ** 2))
                                        }} MiB
                                    </span>
                                </template>
                                <template v-slot:item.actions="{ item }">
                                    <v-tooltip open-delay="500" bottom v-if="item.error.status || item.cancelled">
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn icon x-small class="mx-1" @click="restartBuild(item.name)" v-on="on">
                                                <v-icon>mdi-restart</v-icon>
                                            </v-btn>
                                        </template>
                                        <span>Restart construction process for this database.</span>
                                    </v-tooltip>
                                    <v-tooltip open-delay="500" bottom v-else>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn
                                                icon
                                                x-small
                                                :disabled="item.ready"
                                                class="mx-1"
                                                @click="stopDatabase(item.name)"
                                                :loading="dbsBeingStopped.includes(item.name)"
                                                v-on="on">
                                                <v-icon>mdi-stop</v-icon>
                                            </v-btn>
                                        </template>
                                        <span>Stop construction process for this database.</span>
                                    </v-tooltip>
                                    <v-tooltip open-delay="500" bottom>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn
                                                icon
                                                x-small
                                                class="mx-1"
                                                @click="deleteDatabase(item.name)"
                                                :loading="dbsBeingDeleted.indexOf(item.name) !== -1"
                                                v-on="on">
                                                <v-icon>mdi-delete</v-icon>
                                            </v-btn>
                                        </template>
                                        <span>Delete this database.</span>
                                    </v-tooltip>
                                    <v-tooltip open-delay="500" bottom>
                                        <template v-slot:activator="{ on, attrs }">
                                            <v-btn
                                                icon
                                                x-small
                                                class="mx-1"
                                                v-on="on"
                                                @click="copyDatabase(item)">
                                                <v-icon>
                                                    mdi-content-copy
                                                </v-icon>
                                            </v-btn>
                                        </template>
                                        <span>Create new database with the same configuration as this one.</span>
                                    </v-tooltip>
                                </template>
                                <template v-slot:item.status="{ item }">
                                    <td>
                                        <v-tooltip v-if="item.cancelled" open-delay="500" bottom>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-icon color="warning" v-on="on">mdi-cancel</v-icon>
                                            </template>
                                            <span>Database construction was cancelled by the user.</span>
                                        </v-tooltip>
                                        <v-tooltip bottom v-else-if="item.error.status" open-delay="500">
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-icon color="error" v-on="on">mdi-alert-circle</v-icon>
                                            </template>
                                            <span>Database construction failed. Please try again.</span>
                                        </v-tooltip>
                                        <v-tooltip bottom v-else-if="item.ready" open-delay="500">
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-icon color="success" v-on="on">mdi-check</v-icon>
                                            </template>
                                            <span>Database is ready</span>
                                        </v-tooltip>
                                        <v-tooltip v-else>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-icon v-on="on">mdi-progress-clock</v-icon>
                                            </template>
                                            <span>{{ item.progress.step }}</span>
                                        </v-tooltip>
                                    </td>
                                </template>
                                <template
                                    v-slot:expanded-item="{ headers, item }">
                                    <td :colspan="headers.length">
                                        <div class="my-2">
                                            <div
                                                v-if="!item.error.status && !item.cancelled && item.ready"
                                                class="d-flex flex-column align-center py-4">
                                                <v-avatar color="green">
                                                    <v-icon dark>mdi-check</v-icon>
                                                </v-avatar>
                                                <div class="mt-2">
                                                    This custom database has been constructed successfully and can be
                                                    used as part of an analysis. Head over to the analysis page and
                                                    open up a new sample to get started.
                                                </div>
                                            </div>
                                            <div v-if="item.cancelled" class="d-flex flex-column align-center py-4">
                                                <v-avatar color="warning">
                                                    <v-icon dark>mdi-cancel</v-icon>
                                                </v-avatar>
                                                <div class="mt-2">
                                                    You cancelled the construction of this database. You can
                                                    <a @click="restartBuild(item.name)">restart</a> the
                                                    analysis when you are ready to continue.
                                                </div>
                                            </div>
                                            <div v-else-if="item.error.status">
                                                <v-alert prominent type="error" text>
                                                    <div class="mb-4">
                                                        An unexpected error has occurred during this database build.
                                                        Details about this specific error are shown below. You can
                                                        <a @click="restartBuild(item.name)">restart</a> the
                                                        analysis to try again. If you believe that this error is not the
                                                        result of a user action, then please contact us and provide the
                                                        error details below. Make sure to check your internet connection
                                                        before continuing.

                                                    </div>

                                                    <div class="font-weight-bold">Application error details</div>
                                                    <error-detail-viewer :message="item.error.message"/>
                                                    <div class="font-weight-bold mt-4">Database build logs</div>
                                                    <error-detail-viewer :message="item.progress.logs.join('\n')" />
                                                </v-alert>
                                            </div>
                                            <div v-else class="d-flex flex-column align-center py-4">
                                                <progress-report-summary
                                                    :progress-report="item.progress"
                                                    :with-logs="true" />
                                            </div>
                                        </div>
                                    </td>
                                </template>
                            </v-data-table>
                            <div class="d-flex flex-row align-center mt-4">
                                <disk-usage-bar class="flex-grow-1 my-1" :folder="databaseFolder" style="max-width: 700px;" />
                                <v-spacer></v-spacer>
                                <v-btn color="primary" @click="createNewDatabase()">
                                    Create custom database
                                </v-btn>
                            </div>
                            <create-custom-database
                                v-model="createDatabaseDialog"
                                :database-name-default="databaseNameDefault"
                                :selected-sources-default="selectedSourceDefault"
                                :selected-taxa-default="selectedTaxaDefault"
                                :selected-version-default="selectedVersionDefault"
                            />
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import CreateCustomDatabase from "@/components/custom-database/CreateCustomDatabase.vue";
import { NcbiId, NcbiOntologyProcessor, NcbiTaxon, Ontology, StringUtils, Tooltip } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import ProgressReportSummary from "@/components/analysis/ProgressReportSummary.vue";
import CachedNcbiResponseCommunicator from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import { Watch } from "vue-property-decorator";
import DiskUsageBar from "@/components/filesystem/DiskUsageBar.vue";
import ErrorDetailViewer from "@/components/error/ErrorDetailViewer.vue";
import { promises as fs } from "fs";

@Component({
    components: {
        ErrorDetailViewer,
        DiskUsageBar,
        ProgressReportSummary,
        CreateCustomDatabase,
        Tooltip
    }
})
export default class CustomDatabasePage extends Vue {
    private createDatabaseDialog = false;

    private dockerConnectionError = false;

    // Error that's shown when the selected folder for storing databases is not readable or does not exist.
    private dbFolderError = false;

    private lowOnMemoryWarning = false;
    // The amount of memory that's currently allocated to the Docker daemon.
    private availableMemoryAmount = 0;

    private dockerCheckTimeout: NodeJS.Timeout;

    private forceStopInProgress = false;

    private loading = true;

    private selectedSourceDefault: string[] = ["TrEMBL", "SwissProt"];
    private databaseNameDefault = "";
    private selectedVersionDefault = "Current";
    private selectedTaxaDefault: NcbiTaxon[] = [];

    private headers = [
        {
            text: "Status",
            align: "start",
            sortable: true,
            value: "status"
        },
        {
            text: "Name",
            align: "start",
            sortable: true,
            value: "name"
        },
        {
            text: "Source",
            align: "start",
            sortable: true,
            value: "sourceTypes"
        },
        {
            text: "Taxa filter",
            align: "start",
            sortable: true,
            value: "taxa"
        },
        {
            text: "UniProtKB records",
            align: "start",
            sortable: true,
            value: "entries"
        },
        {
            text: "Size on disk",
            align: "start",
            sortable: true,
            value: "sizeOnDisk"
        },
        {
            text: "Actions",
            align: "center",
            sortable: false,
            value: "actions"
        }
    ];

    private expandedItems: [] = [];
    private ncbiOntology: Ontology<NcbiId, NcbiTaxon>;

    private dbsBeingDeleted: string[] = [];
    private dbsBeingStopped: string[] = [];

    private databaseFolder = "";

    get databases(): CustomDatabase[] {
        return this.$store.getters["customDatabases/databases"];
    }

    private async mounted(): Promise<void> {
        await this.databasesUpdated();

        this.dockerCheckTimeout = setInterval(async() => {
            this.dockerConnectionError = !(await this.checkDockerConnection());
            this.dbFolderError = !(await this.databaseFolderExists());
        }, 1000);

        const configurationMng = new ConfigurationManager();
        const config = await configurationMng.readConfiguration();

        this.databaseFolder = config.customDbStorageLocation;
    }

    private beforeDestroy(): void {
        if (this.dockerCheckTimeout) {
            clearInterval(this.dockerCheckTimeout);
        }
    }

    @Watch("databases")
    private async databasesUpdated() {
        this.loading = true;
        const ncbiProcessor = new NcbiOntologyProcessor(new CachedNcbiResponseCommunicator());
        this.ncbiOntology = await ncbiProcessor.getOntologyByIds(
            this.databases.map(d => d.taxa).flat()
        );
        this.loading = false;
    }

    private async checkDockerConnection(): Promise<boolean> {
        const dockerCommunicator = new DockerCommunicator(this.databaseFolder);

        try {
            const dockerInfo = await dockerCommunicator.getDockerInfo();
            this.availableMemoryAmount = dockerInfo.MemTotal;

            this.lowOnMemoryWarning = this.availableMemoryAmount < 6 * (1024 ** 3);

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * This function checks if the folder that's currently been set for storage of custom databases does exist and is
     * readable.
     *
     * @return True when the given database folder does exist and __is__ readable.
     */
    private async databaseFolderExists(): Promise<boolean> {
        try {
            const stats = await fs.lstat(this.databaseFolder);
            return stats.isDirectory();
        } catch (error) {
            // Folder does not exist.
            return false;
        }
    }

    private async restartBuild(dbName: string): Promise<void> {
        this.$store.dispatch("customDatabases/reanalyzeDatabase", dbName);
    }

    private async stopDatabase(dbName: string): Promise<void> {
        this.dbsBeingStopped.push(dbName);
        await this.$store.dispatch("customDatabases/stopDatabase", dbName);
        this.dbsBeingStopped.splice(this.dbsBeingStopped.indexOf(dbName), 1);
    }

    private async deleteDatabase(dbName: string): Promise<void> {
        this.dbsBeingDeleted.push(dbName);
        await this.stopDatabase(dbName);
        await this.$store.dispatch("customDatabases/deleteDatabase", dbName);
        this.dbsBeingDeleted.splice(this.dbsBeingDeleted.indexOf(dbName), 1);
    }

    private resetDatabaseDefaults(): void {
        this.selectedSourceDefault.splice(0, this.selectedSourceDefault.length);
        this.selectedSourceDefault.push("trembl", "swissprot");
        this.databaseNameDefault = "";
        this.selectedVersionDefault = "Current";
        this.selectedTaxaDefault.splice(0, this.selectedTaxaDefault.length);
    }

    private createNewDatabase(): void {
        this.resetDatabaseDefaults();
        this.createDatabaseDialog = true;
    }

    private async copyDatabase(db: CustomDatabase): Promise<void> {
        this.selectedSourceDefault.splice(0, this.selectedSourceDefault.length);
        this.selectedSourceDefault.push(...db.sourceTypes);
        this.databaseNameDefault = this.generateUniqueDbName(db.name);
        this.selectedVersionDefault = db.databaseVersion;

        this.selectedTaxaDefault.splice(0, this.selectedTaxaDefault.length);
        const ncbiOntologyProcessor = new NcbiOntologyProcessor(new CachedNcbiResponseCommunicator());
        const ontology = await ncbiOntologyProcessor.getOntologyByIds(db.taxa);
        this.selectedTaxaDefault.push(...(db.taxa.map(id => ontology.getDefinition(id))));

        this.createDatabaseDialog = true;
    }

    /**
     * Generate a unique database name from the given parameter. The index number that corresponds this name will be
     * increased by one until the new name does not already exist.
     *
     * @param dbName
     */
    private generateUniqueDbName(dbName: string): string {
        let counter = 1;
        let newName = `${dbName} (${counter})`;

        while (this.databases.filter(db => db.name === newName).length !== 0) {
            counter++;
            newName = `${dbName} (${counter})`;
        }

        return newName;
    }

    private toHumanReadableNumber(n: number): string {
        return StringUtils.toHumanReadableNumber(n);
    }
}
</script>

<style scoped>
.logview {
    background-color: #1a1a1a !important;
    color: white;
    font-family: "Roboto mono", monospace;
    width: 100%;
    min-height: 200px;
}

.taxa-filter {
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}
</style>
