<template>
    <v-dialog v-model="dialogActive" max-width="900" v-on:click:outside="cancel">
        <v-card>
            <v-card-title>
                Search configuration
            </v-card-title>
            <v-card-text>
                <p>
                    Please configure the search settings that should be applied to each imported assay. Note that
                    enabling the <span class="font-italic">advanced missed cleavage handling</span> setting has a
                    serious performance impact and leads to a slower analysis!
                </p>
                <v-data-table
                    :items="tableItems"
                    :headers="tableHeaders"
                    class="searchConfigTable">
                    <template v-slot:header.equateIl="{ header }">
                        {{ header.text }}
                        <div>
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
                        <div>
                            <a v-if="areAllFilterDuplicate" @click="areAllFilterDuplicate = false">
                                Uncheck all
                            </a>
                            <a v-else @click="areAllFilterDuplicate = true">
                                Check all
                            </a>
                        </div>
                    </template>
                    <template v-slot:header.missedCleavage="{ header }">
                        {{ header.text }}
                        <div>
                            <a v-if="areAllMissedCleavage" @click="areAllMissedCleavage = false">
                                Uncheck all
                            </a>
                            <a v-else @click="areAllMissedCleavage = true">
                                Check all
                            </a>
                        </div>
                    </template>
                    <template v-slot:item.equateIl="{ item }">
                        <v-simple-checkbox v-model="item.equateIl" color="primary">
                        </v-simple-checkbox>
                    </template>
                    <template v-slot:item.filterDuplicates="{ item }">
                        <v-simple-checkbox v-model="item.filterDuplicates" color="primary">
                        </v-simple-checkbox>
                    </template>
                    <template v-slot:item.missedCleavage="{ item }">
                        <v-simple-checkbox v-model="item.missedCleavage" color="primary">
                        </v-simple-checkbox>
                    </template>
                </v-data-table>
                <div class="d-flex justify-center mt-4">
                    <v-btn @click="cancel" class="mr-2">
                        Cancel
                    </v-btn>
                    <v-btn color="primary" @click="setConfigs">
                        Start analysis
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { ProteomicsAssay, SearchSettingsForm, SearchConfiguration  } from "unipept-web-components";

type SearchConfigTableItem = {
    name: string,
    equateIl: boolean,
    filterDuplicates: boolean,
    missedCleavage: boolean,
    assay: ProteomicsAssay
}

@Component({
    components: {
        SearchSettingsForm
    },
    computed: {
        areAllEquateIl: {
            get() {
                return this.tableItems.every(item => item.equateIl);
            },
            set(value) {
                for (const item of this.tableItems) {
                    item.equateIl = value;
                }
            }
        },
        areAllFilterDuplicate: {
            get() {
                return this.tableItems.every(item => item.filterDuplicates);
            },
            set() {
                const value = !this.areAllFilterDuplicate;
                for (const item of this.tableItems) {
                    item.filterDuplicates = value;
                }
            }
        },
        areAllMissedCleavage: {
            get() {
                return this.tableItems.every(item => item.missedCleavage);
            },
            set() {
                const value = !this.areAllMissedCleavage;
                for (const item of this.tableItems) {
                    item.missedCleavage = value;
                }
            }
        }
    }
})
export default class SearchConfigurationDialog extends Vue {
    @Prop({ required: true })
    private value: boolean;
    @Prop({ required: true })
    private assays: ProteomicsAssay[];
    /**
     * What function should be executed after the user clicked OK?
     */
    @Prop({ required: false, default: async(cancelled: boolean) => {
        return;
    } })
    private callback: (cancelled: boolean) => Promise<void>;

    private dialogActive: boolean = false;

    private tableItems: SearchConfigTableItem[] = [];
    private tableHeaders = [
        {
            text: "Assay name",
            align: "start",
            sortable: true,
            value: "name",
            width: "25%"
        }, {
            text: "Equate I/L",
            align: "center",
            sortable: false,
            value: "equateIl",
            width: "25%"
        }, {
            text: "Filter duplicates",
            align: "center",
            sortable: false,
            value: "filterDuplicates",
            width: "25%"
        }, {
            text: "Advanced missed cleavages",
            align: "center",
            sortable: false,
            value: "missedCleavage",
            width: "25%"
        }
    ];

    @Watch("assays", {
        immediate: true
    })
    private onAssaysChanged() {
        this.tableItems.splice(0, this.tableItems.length);
        for (const assay of this.assays) {
            this.tableItems.push({
                name: assay.getName(),
                equateIl: true,
                filterDuplicates: true,
                missedCleavage: false,
                assay
            });
        }
    }

    @Watch("value")
    private async onValueChanged() {
        this.dialogActive = this.value;
    }

    private async setConfigs() {
        for (const item of this.tableItems) {
            const config = new SearchConfiguration(item.equateIl, item.filterDuplicates, item.missedCleavage);
            item.assay.setSearchConfiguration(config);
        }
        await this.callback(false);
        this.dialogActive = false;
        this.$emit("input", this.dialogActive);
    }

    private async cancel() {
        await this.callback(true);
        this.dialogActive = false;
        this.$emit("input", this.dialogActive);
    }
}
</script>

<style>
    .searchConfigTable th {
        vertical-align: baseline;
        padding-top: 8px;
    }
</style>
