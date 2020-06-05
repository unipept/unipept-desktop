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

@Component({
    components: {
        DatasetForm
    }
})
export default class CreateAssay extends Vue {
    @Prop({ required: true })
    private study: Study;
    @Prop({ required: true })
    private project: Project;
    private peptides: string;
    private name: string;

    private async createAssay() {
        // const assay: Assay = this.project.createMetaProteomicsAssay(
        //     this.name,
        //     this.peptides.split(/\r?\n/),
        //     this.study
        // );
        // this.$emit("create-assay", assay);
    }
}
</script>

<style scoped>

</style>
