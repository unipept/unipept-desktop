<template>
    <div>
        <Toolbar v-on:click-select-sample="onClickSelectSample"></Toolbar>
        <v-dialog v-model="selectSampleDialog">
            <load-datasets-card :selected-datasets="this.$store.getters.selectedDatasets" :stored-datasets="this.$store.getters.storedDatasets"></load-datasets-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Toolbar from "./../navigation-drawers/Toolbar.vue";

@Component({
    components: {
        Toolbar
    }
})
export default class SampleManager extends Vue{
    private selectSampleDialog: boolean = false;

    private onClickSelectSample() {
        this.selectSampleDialog = true;
    }
}
</script>

<style>

</style>