<template>
    <v-dialog v-model="dialogVisible" max-width="600px">
        <v-card>
            <v-card-title>Experiment summary</v-card-title>
            <v-card-text>
                <span v-if="!assay || loading">
                    <v-progress-circular :size="50" :width="5" color="primary" indeterminate></v-progress-circular>
                </span>
                <div v-else>
                    We managed to match {{ matchedPeptides }} of your {{ searchedPeptides }} peptides.
                    <span v-if="missedPeptides.length > 0">
                        Unfortunately {{ missedPeptides.length }} peptides couldn't be found.
                    </span>
                    <missing-peptides-list :dataset="assay">
                    </missing-peptides-list>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import { Prop, Component, Watch } from "vue-property-decorator";
import TaxaDataSource from "unipept-web-components/src/logic/data-source/TaxaDataSource";
import MissingPeptidesList from "unipept-web-components/src/components/analysis/statistics/MissingPeptidesList.vue";

@Component({
    components: {
        MissingPeptidesList
    }
})
export default class ExperimentSummaryDialog extends Vue {
    @Prop({ required: true })
    private assay: Assay;
    @Prop({ required: true })
    private active: boolean;

    private dialogVisible: boolean = false;

    private searchedPeptides: number = 0;
    private matchedPeptides: number = 0;
    private missedPeptides: string[] = [];

    private loading: boolean = true;

    public mounted() {
        this.dialogVisible = this.active;
        this.onAssayChanged();
    }

    @Watch("active")
    private onActiveChanged() {
        this.dialogVisible = this.active;
    }

    @Watch("dialogVisible")
    private onDialogVisibleChanged() {
        this.$emit("update:active", this.dialogVisible);
    }

    @Watch("assay")
    private async onAssayChanged(): Promise<void> {
        if (this.assay) {
            this.loading = true;
            let taxaSource: TaxaDataSource = await this.assay.dataRepository.createTaxaDataSource();
            this.searchedPeptides = await taxaSource.getAmountOfSearchedPeptides();
            this.matchedPeptides = await taxaSource.getAmountOfMatchedPeptides();
            this.missedPeptides = await taxaSource.getMissedPeptides();
            this.loading = false;
        }
    }
}
</script>

<style>

</style>