<template>
    <div class="collapsable-card">
        <h2 class="mx-auto settings-category-title" @click="collapsed = !collapsed" style="cursor: pointer;">
            <v-icon v-if="collapsed">mdi-chevron-right</v-icon>
            <v-icon v-else>mdi-chevron-down</v-icon>
            <slot name="title"></slot>
        </h2>
        <slot name="content" v-if="!collapsed"></slot>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class CollapsableCard extends Vue {
    private collapsed = false;
}
</script>

<style scoped>
    .collapsable-card:not(:first-child) {
        margin-top: 32px;
    }
</style>
