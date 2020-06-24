<template>
    <div>
        <dataset-form
            :showSave="false"
            v-on:peptide-change="peptides = $event"
            v-on:name-change="name = $event"
        >
        </dataset-form>
        <div style="display: flex; justify-content: center;">
            <v-btn color="primary" @click="createAssay">Create assay</v-btn>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import Component from "vue-class-component";
import DatasetForm from "unipept-web-components/src/components/dataset/DatasetForm.vue";
import Project from "@/logic/filesystem/project/Project";
import Study from "unipept-web-components/src/business/entities/study/Study";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";
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
}
</script>

<style scoped>

</style>
