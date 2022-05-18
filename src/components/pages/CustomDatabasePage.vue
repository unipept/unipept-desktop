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

                            <v-alert type="warning" prominent text v-if="buildInProgressError">
                                <div>
                                    Docker is still processing a Unipept database that was started outside of this
                                    application. The application can only continue with constructing databases if no
                                    such zombie processes are active.
                                </div>

                                <v-divider class="my-2 warning" style="opacity: 0.22"></v-divider>

                                <v-row align="center" no-gutters>
                                    <v-col class="grow">
                                        Click "force stop" to stop this zombie process immediately and return the
                                        control to this application.
                                    </v-col>
                                    <v-col class="shrink">
                                        <v-btn
                                            color="warning"
                                            outlined
                                            @click="forceStop()"
                                            :loading="forceStopInProgress">
                                            Force stop
                                        </v-btn>
                                    </v-col>
                                </v-row>
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
                                    <v-btn icon x-small :disabled="item.ready && !item.cancelled" class="mx-1">
                                        <v-icon v-if="item.error.status" @click="restartBuild(item.name)">
                                            mdi-restart
                                        </v-icon>
                                        <v-icon v-else @click="stopDatabase(item.name)">
                                            mdi-stop
                                        </v-icon>
                                    </v-btn>
                                    <v-btn
                                        icon
                                        x-small
                                        class="mx-1"
                                        @click="deleteDatabase(item.name)"
                                        :loading="dbsBeingDeleted.indexOf(item.name) !== -1">
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                    <v-btn icon x-small class="mx-1">
                                        <v-icon>mdi-information</v-icon>
                                    </v-btn>
                                </template>
                                <template v-slot:item.status="{ item }">
                                    <td>
                                        <v-tooltip v-if="item.cancelled" open-delay="500">
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
                                                    <textarea
                                                        :value="item.error.object ? item.error.object.stack : this.errorMessage"
                                                        class="logview pa-2"
                                                        disabled />
                                                    <div class="font-weight-bold mt-4">Database build logs</div>
                                                    <textarea
                                                        :value="item.progress.logs.join('\n')"
                                                        class="logview pa-2"
                                                        disabled />
                                                </v-alert>
                                            </div>
                                            <div v-else-if="item.ready" class="d-flex flex-column align-center py-4">
                                                <v-avatar color="green">
                                                    <v-icon dark>mdi-check</v-icon>
                                                </v-avatar>
                                                <div class="mt-2">
                                                    This custom database has been constructed successfully and can be
                                                    used as part of an analysis. Head over to the analysis page and
                                                    open up a new sample to get started.
                                                </div>
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
                            <div class="d-flex justify-end mt-4">
                                <v-btn color="primary" @click="createDatabaseDialog = true">
                                    Create custom database
                                </v-btn>
                            </div>
                            <create-custom-database v-model="createDatabaseDialog"></create-custom-database>
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

@Component({
    components: { ProgressReportSummary, CreateCustomDatabase, Tooltip }
})
export default class CustomDatabasePage extends Vue {
    private createDatabaseDialog: boolean = false;

    private dockerConnectionError: boolean = false;
    private buildInProgressError: boolean = false;

    private dockerCheckTimeout: NodeJS.Timeout;

    private forceStopInProgress: boolean = false;

    private loading: boolean = true;

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
            text: "UniProt records",
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

    get databases(): CustomDatabase[] {
        return this.$store.getters["customDatabases/databases"];
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

    private async mounted(): Promise<void> {
        await this.databasesUpdated();

        this.dockerCheckTimeout = setInterval(async() => {
            this.dockerConnectionError = !(await this.checkDockerConnection());
            if (!this.dockerConnectionError) {
                this.buildInProgressError = await this.checkZombieBuildInProgress();
            }
        }, 1000);
    }

    private beforeDestroy(): void {
        if (this.dockerCheckTimeout) {
            clearInterval(this.dockerCheckTimeout);
        }
    }

    private async checkDockerConnection(): Promise<boolean> {
        const dockerCommunicator = new DockerCommunicator();

        try {
            await dockerCommunicator.getDockerInfo();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Returns true if a zombie database construction process is still running in the Docker daemon.
     */
    private async checkZombieBuildInProgress(): Promise<boolean> {
        if (this.$store.getters.constructionInProgress) {
            return false;
        }

        const dockerCommunicator = new DockerCommunicator();
        return await dockerCommunicator.isDatabaseActive();
    }

    private async restartBuild(dbName: string): Promise<void> {
        this.$store.dispatch("customDatabases/reanalyzeDatabase", dbName);
    }

    private async stopDatabase(dbName: string): Promise<void> {
        return this.$store.dispatch("customDatabases/stopDatabase", dbName);
    }

    private async deleteDatabase(dbName: string): Promise<void> {
        this.dbsBeingDeleted.push(dbName);
        await this.stopDatabase(dbName);
        await this.$store.dispatch("customDatabases/deleteDatabase", dbName);
        this.dbsBeingDeleted.splice(this.dbsBeingDeleted.indexOf(dbName), 1);
    }

    private async forceStop(): Promise<void> {
        this.forceStopInProgress = true;
        const dockerCommunicator = new DockerCommunicator();
        await dockerCommunicator.stopDatabase();
        this.forceStopInProgress = false;
    }

    private toHumanReadableNumber(n: number): string {
        return StringUtils.toHumanReadableNumber(n);
    }
}
</script>

<style scoped>
.logview {
    background-color: #1a1a1a;
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
