<template>
    <v-dialog v-model="dialogVisible" max-width="600px">
        <v-card>
            <v-card-title>Experiment summary</v-card-title>
            <v-card-text>
                <span v-if="!peptideTrust" style="display: flex; justify-content: center;">
                    <v-progress-circular :size="50" :width="5" color="primary" indeterminate></v-progress-circular>
                </span>
                <div v-else>
                    We managed to match {{ peptideTrust.matchedPeptides }} of your
                    {{ peptideTrust.searchedPeptides }} peptides.
                    <span v-if="peptideTrust.missedPeptides.length > 0">
                        Unfortunately {{ peptideTrust.missedPeptides.length }} peptides couldn't be found.
                    </span>
                    <missing-peptides-list :missed-peptides="peptideTrust.missedPeptides">
                    </missing-peptides-list>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component, Watch } from "vue-property-decorator";
import MissingPeptidesList from "unipept-web-components/src/components/analysis/statistics/MissingPeptidesList.vue";
import PeptideTrust from "unipept-web-components/src/business/processors/raw/PeptideTrust";

@Component({
    components: {
        MissingPeptidesList
    }
})
export default class ExperimentSummaryDialog extends Vue {
    @Prop({ required: true })
    private peptideTrust: PeptideTrust;
    @Prop({ required: true })
    private active: boolean;

    private dialogVisible: boolean = false;

    public mounted() {
        this.dialogVisible = this.active;
    }

    @Watch("active")
    private onActiveChanged() {
        this.dialogVisible = this.active;
    }

    @Watch("dialogVisible")
    private onDialogVisibleChanged() {
        this.$emit("update:active", this.dialogVisible);
    }
}
</script>

<style>

</style>
