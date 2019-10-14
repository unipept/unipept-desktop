<template>
    <div>
        <Toolbar :open.sync="open" :mini.sync="mini" v-on:click-select-sample="onClickSelectSample" v-on:activate-dataset="onActivateDataset"></Toolbar>
        <v-dialog v-model="selectSampleDialog">
            <load-datasets-card :selected-datasets="this.$store.getters.selectedDatasets" :stored-datasets="this.$store.getters.storedDatasets" v-on:select-dataset="onSelectDataset"></load-datasets-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Toolbar from "./../navigation-drawers/Toolbar.vue";
import LoadDatasetsCard from "unipept-web-components/src/components/dataset/LoadDatasetsCard.vue";
import {Prop, Watch} from "vue-property-decorator";
import PeptideContainer from "unipept-web-components/src/logic/data-management/PeptideContainer";

@Component({
    components: {
        Toolbar,
        LoadDatasetsCard
    }
})
export default class SampleManager extends Vue {
    @Prop({required: false, default: false})
    private open: boolean;
    @Prop({required: false, default: true})
    private mini: boolean;

    private selectSampleDialog: boolean = false;

    @Watch('mini')
    private onMiniChanged(newMini: boolean) {
        this.$emit('update:mini', newMini);
    }

    private onClickSelectSample() {
        this.selectSampleDialog = true;
    }

    private onSelectDataset(dataset: PeptideContainer): void {
        this.$store.dispatch('selectDataset', dataset);
        this.$store.dispatch('processDataset', dataset);
        this.selectSampleDialog = false;
    }

    private onActivateDataset(dataset: PeptideContainer): void {
        this.$store.dispatch('setActiveDataset', dataset);
    }
}
</script>

<style>

</style>