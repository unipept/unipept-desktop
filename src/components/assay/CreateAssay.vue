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
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import Component from "vue-class-component";
import DatasetForm from "unipept-web-components/src/components/dataset/DatasetForm.vue";
import Study from "unipept-web-components/src/logic/data-management/study/Study";

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
        // const assay: Assay = await this.study.createAssay();
        // assay.setName(this.name);
        // this.$emit("create-assay", assay);
    }
}
</script>

<style scoped>

</style>