<template>
    <div>
        <dataset-form
            :showSave="false"
            v-on:peptide-change="peptides = $event"
            v-on:name-change="name = $event">
        </dataset-form>
        <div class="d-flex justify-center">
            <v-btn @click="cancelCreation" class="mr-2">Cancel</v-btn>
            <v-btn color="primary" @click="createAssay">Create assay</v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import Component from "vue-class-component";
import { DatasetForm, Study, ProteomicsAssay } from "unipept-web-components";
import { v4 as uuidv4 } from "uuid";

@Component({
    components: {
        DatasetForm
    }
})
export default class CreateAssay extends Vue {
    @Prop({ required: true })
    private study: Study;
    private peptides: string;
    private name: string;

    private async createAssay() {
        const assay: ProteomicsAssay = new ProteomicsAssay(uuidv4());
        assay.setName(this.name);
        assay.setPeptides(this.peptides.split(/\r?\n/));

        this.$emit("create-assay", assay);
    }

    private async cancelCreation() {
        this.$emit("cancel");
    }
}
</script>

<style scoped>

</style>
