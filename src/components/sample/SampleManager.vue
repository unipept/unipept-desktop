<template>
    <div>
        <Toolbar :open.sync="isOpen" :mini.sync="isMini" v-on:click-select-sample="onClickSelectSample" v-on:activate-dataset="onActivateDataset"></Toolbar>
        <v-dialog v-model="selectSampleDialog" max-width="800">
            <v-card>
                <v-card-title>
                    Sample selection
                </v-card-title>
                <load-datasets-card :selected-datasets="this.$store.getters.selectedDatasets" :stored-datasets="this.$store.getters.storedDatasets" v-on:select-dataset="onSelectDataset"></load-datasets-card>
            </v-card>
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

    private isMini: boolean = false;
    private isOpen: boolean = true;

    private selectSampleDialog: boolean = false;

    mounted() {
        this.isMini = this.mini;
        this.isOpen = this.open;
    }

    @Watch("mini")
    private onMiniChanged() {
        this.isMini = this.mini;
    }

    @Watch("open") 
    private onOpenChanged() {
        this.isOpen = this.open;
    }

    @Watch('isMini')
    private onIsMiniChanged(newMini: boolean) {
        this.$emit('update:mini', newMini);
    }

    @Watch('isOpen')
    private onIsOpenChanged(newOpen: boolean) {
        this.$emit('update:open', newOpen);
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