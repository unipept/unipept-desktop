<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <div style="max-width: 1200px; margin: auto;">
                    <h2 class="mx-auto settings-category-title">Custom databases</h2>
                    <v-card>
                        <v-card-text>
                            <div>
                                Below you can find a list of all custom databases that are currently registered to this
                                application. To create a new custom database, press the floating button in the lower
                                right corner. A wizard will guide you through the custom database construction process.
                                Please note that Docker must be configured correctly in the
                                <router-link to="/settings">settings</router-link> before new databases can be created.
                            </div>
                            <v-data-table
                                :headers="headers"
                                show-expand
                                :expanded.sync="expandedItems"
                                :items="databases"
                                item-key="database.name">
                                <template v-slot:item.actions="{ item }">
                                    <v-icon small>mdi-delete</v-icon>
                                    <v-icon small>mdi-information</v-icon>
                                </template>
                                <template v-slot:item.status="{ item }">
                                    <td>
                                        <v-tooltip bottom v-if="item.error.status" open-delay="500">
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-icon color="error" v-on="on">mdi-alert-circle</v-icon>
                                            </template>
                                            <span>Database construction failed. Please try again.</span>
                                        </v-tooltip>
                                        <v-tooltip bottom v-else-if="item.ready" open-delay="500">
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-icon color="success">mdi-check</v-icon>
                                            </template>
                                            <span>Database is ready</span>
                                        </v-tooltip>
                                        <v-tooltip v-else>
                                            <template v-slot:activator="{ on, attrs }">
                                                <v-icon>mdi-progress-clock</v-icon>
                                            </template>
                                            <span>{{ item.progress.step }}</span>
                                        </v-tooltip>
                                    </td>
                                </template>
                                <template
                                    v-slot:expanded-item="{ headers, item }">
                                    <td :colspan="headers.length">
                                        <div class="my-2">
                                            <div v-if="item.error.status">
                                                <v-alert prominent type="error" text>
                                                    <div class="mb-4">
                                                        An unexpected error has occurred during this database build.
                                                        Details about this specific error are shown below. You can
                                                        <a @click="restartBuild(item.database.name)">restart</a> the analysis to try again. If
                                                        you believe that this error is not the result of a user action,
                                                        then please contact us and provide the error details below. Make
                                                        sure to check your internet connection before continuing.
                                                    </div>

                                                    <div class="font-weight-bold">Error details</div>
                                                    <div>
                                                        {{ item.error.object ? item.error.object.stack : errorMessage }}
                                                    </div>
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
                                                <progress-report-summary :progress-report="item.progress" />
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
import { Tooltip } from "unipept-web-components";
import { CustomDatabaseInfo } from "@/state/DockerStore";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import ProgressReportSummary from "@/components/analysis/ProgressReportSummary.vue";

@Component({
    components: { ProgressReportSummary, CreateCustomDatabase, Tooltip },
    computed: {
        databases: {
            get(): CustomDatabaseInfo[] {
                return [...Object.values(this.$store.getters.databases)] as CustomDatabaseInfo[];
            }
        }
    }
})
export default class CustomDatabasePage extends Vue {
    private createDatabaseDialog: boolean = false;

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
            value: "database.name"
        },
        {
            text: "Source",
            align: "start",
            sortable: true,
            value: "database.sourceTypes"
        },
        {
            text: "Taxa filter",
            align: "start",
            sortable: true,
            value: "database.taxa"
        },
        {
            text: "Number of entries",
            align: "start",
            sortable: true,
            value: "database.entries"
        },
        {
            text: "Actions",
            align: "center",
            sortable: false,
            value: "actions"
        }
    ];

    private expandedItems: [] = [];

    private async restartBuild(dbName: string): Promise<void> {
        console.log("DB Name: " + dbName);
        this.$store.dispatch("reanalyzeDb", dbName);
    }
}
</script>

<style scoped>

</style>
