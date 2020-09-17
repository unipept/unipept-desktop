<template>
    <v-dialog v-model="dialogActive" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Search configuration
            </v-card-title>
            <v-card-text>
                <p>
                    Please configure the search settings that should be applied to this sample. Note that enabling the
                    <span class="font-italic">advanced missed cleavage handling</span> setting has a serious performance
                    impact and leads to a slower analysis!
                </p>
                <search-settings-form
                    :horizontal="false"
                    :equate-il.sync="equateIl"
                    :filter-duplicates.sync="filterDuplicates"
                    :missing-cleavage.sync="missedCleavage">
                </search-settings-form>
                <div class="d-flex justify-center mt-4">
                    <v-btn color="primary" @click="setConfig">
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
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";

@Component({
    components: {
        SearchSettingsForm
    }
})
export default class SearchConfigurationDialog extends Vue {
    @Prop({ required: true })
    private value: boolean;
    @Prop({ required: true })
    private assay: ProteomicsAssay;
    /**
     * What function should be executed after the user clicked OK?
     */
    @Prop({ required: false, default: async() => {
        return;
    } })
    private callback: () => Promise<void>;

    private dialogActive: boolean = false;

    private equateIl: boolean = true;
    private filterDuplicates: boolean = true;
    private missedCleavage: boolean = false;


    @Watch("value")
    private async onValueChanged() {
        this.dialogActive = this.value;
    }

    private async setConfig() {
        const config = new SearchConfiguration(this.equateIl, this.filterDuplicates, this.missedCleavage);
        this.assay.setSearchConfiguration(config);
        await this.callback();
        this.dialogActive = false;
        this.$emit("input", this.dialogActive);
    }
}
</script>

<style scoped>

</style>
