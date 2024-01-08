<template>
    <div style="position: relative;">
        <v-tooltip bottom open-delay="500">
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    small
                    :color="copyDone ? 'success' : 'white'"
                    light
                    outlined
                    style="position: absolute; right: 15px; top: 10px;"
                    v-on="on"
                    @click="copyContent">
                    <v-icon v-if="copyDone" small>
                        mdi-check
                    </v-icon>
                    <v-icon v-else small>
                        mdi-content-copy
                    </v-icon>
                </v-btn>
            </template>
            <span>Click to copy content</span>
        </v-tooltip>
        <textarea
            :value="message"
            class="logview pa-2"
            disabled />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class ErrorDetailViewer extends Vue {
    @Prop({ required: true })
    private message: string;

    private copyDone = false;

    private async copyContent(): Promise<void> {
        await navigator.clipboard.writeText(this.message);
        this.copyDone = true;
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                this.copyDone = false;
                resolve();
            }, 1500);
        });
    }
}
</script>

<style scoped>
.logview {
    background-color: #1a1a1a !important;
    color: white;
    font-family: "Roboto mono", monospace;
    width: 100%;
    min-height: 200px;
}
</style>
