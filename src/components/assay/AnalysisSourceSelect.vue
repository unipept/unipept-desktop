<template>
    <v-select
        :items="items"
        label="Analysis source"
        v-model="selectedSource"
        item-text="title"
        hide-details
        dense
        :error="error"
        :error-messages="errorMessages"
        return-object>
        <template v-slot:selection="{ item }">
            <div class="d-flex justify-center">
                <v-icon small v-if="item.type === 'online'" class="mr-1">
                    mdi-web
                </v-icon>
                <v-icon small v-else class="mr-1">
                    mdi-database
                </v-icon>
                <span>
                    {{ item.title }}
                </span>
            </div>
        </template>
        <template v-slot:item="{ item }">
            <v-icon v-if="item.type === 'online'">
                mdi-web
            </v-icon>
            <v-icon v-if="item.type === 'local'">
                mdi-database
            </v-icon>
            <v-list-item two-line>
                <v-list-item-content>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
                </v-list-item-content>
            </v-list-item>
        </template>
    </v-select>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { AnalysisSource, OnlineAnalysisSource } from "unipept-web-components";
import CachedOnlineAnalysisSource from "@/logic/communication/analysis/CachedOnlineAnalysisSource";
import CachedCustomDbAnalysisSource from "@/logic/communication/analysis/CachedCustomDbAnalysisSource";

export type RenderableAnalysisSource = {
    type: "online" | "local",
    title: string,
    subtitle: string
}

@Component
export default class AnalysisSourceSelect extends Vue {
    @Prop({ required: true })
    private value: RenderableAnalysisSource;
    @Prop({ required: true })
    private items: RenderableAnalysisSource[];
    @Prop({ required: false, default: false })
    private error: boolean;
    @Prop({ required: false, default: "" })
    private errorMessages: string | [];

    private selectedSource: RenderableAnalysisSource = null;

    private mounted() {
        this.onValueChanged();
    }

    @Watch("value")
    private onValueChanged() {
        this.selectedSource = this.value;
    }

    @Watch("selectedSource")
    private onSelectedSourceChanged() {
        this.$emit("input", this.selectedSource);
    }
}
</script>

<style scoped>

</style>
