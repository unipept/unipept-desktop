<template>
    <v-dialog v-model="dialogActive" width="600">
        <v-card>
            <v-card-title>Binary files detected</v-card-title>
            <v-card-text>
                One or more of the files you selected are not of the correct file format. Only text-based files that
                contain one peptide per line are supported at this time.
                <ul>
                    <li v-for="file of binaryFiles" :key="file">{{ file }}</li>
                </ul>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="dialogActive = false" color="primary">OK</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

@Component
export default class BinaryFilesErrorDialog extends Vue {
    @Prop({ required: true })
    private value: boolean;
    @Prop({ required: true })
    private binaryFiles: string[];

    private dialogActive = false;

    mounted() {
        this.onValueChanged();
    }

    @Watch("value")
    private onValueChanged() {
        this.dialogActive = this.value;
    }

    @Watch("dialogActive")
    private onRemoveConfirmationActiveChanged() {
        this.$emit("input", this.dialogActive);
    }
}
</script>

<style scoped>

</style>
