<template>
    <v-dialog v-model="removeConfirmationActive" width="600">
        <v-card>
            <v-card-title>Confirm {{ itemType }} deletion</v-card-title>
            <v-card-text>
                Are you sure you want to permanently delete this {{ itemType }}? This action cannot be undone.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="removeConfirmationActive = false">Cancel</v-btn>
                <v-btn text color="red" @click="performAction()">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

@Component
export default class ConfirmDeletionDialog extends Vue {
    @Prop({ required: true })
    private itemType: string;
    @Prop( { required: true })
    private action: () => void;
    @Prop({ required: true })
    private value: boolean;

    private removeConfirmationActive: boolean = false;

    mounted() {
        this.onValueChanged();
    }

    @Watch("value")
    private onValueChanged() {
        this.removeConfirmationActive = this.value;
    }

    @Watch("removeConfirmationActive")
    private onRemoveConfirmationActiveChanged() {
        this.$emit("input", this.removeConfirmationActive);
    }

    private performAction() {
        this.action();
        this.removeConfirmationActive = false;
    }
}
</script>

<style scoped>

</style>