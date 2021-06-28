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
                            <v-simple-table class="mt-6">
                                <template v-slot:default>
                                    <thead>
                                        <tr>
                                            <th class="text-left">
                                                Name
                                            </th>
                                            <th class="text-left">
                                                Source
                                            </th>
                                            <th class="text-left">
                                                Source version
                                            </th>
                                            <th class="text-left">
                                                Taxa filter
                                            </th>
                                            <th class="text-left">
                                                Number of entries
                                            </th>
                                            <th class="text-center">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item of databases" :key="item.name">
                                            <td>{{ item.name }}</td>
                                            <td>{{ item.source }}</td>
                                            <td>{{ item.sourceVersion }}</td>
                                            <td>{{ item.taxa.join(", ") }}</td>
                                            <td>{{ item.entries }}</td>
                                            <td class="text-center">
                                                <v-icon small>mdi-delete</v-icon>
                                                <v-icon small>mdi-information</v-icon>
                                            </td>
                                        </tr>
                                    </tbody>
                                </template>
                            </v-simple-table>
                            <div class="d-flex justify-end mt-4">
                                <v-btn color="primary">Create custom database</v-btn>
                            </div>
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

@Component
export default class CustomDatabasePage extends Vue {
    private databases: CustomDatabase[] = [
        new CustomDatabase("DB 1", "TrEMBL", "2021.2", [23, 4589, 129, 12324], 36123),
        new CustomDatabase("DB 2", "SwissProt", "2020.4", [78123, 23834, 3843, 218723], 38723)
    ];


}
</script>

<style scoped>

</style>
