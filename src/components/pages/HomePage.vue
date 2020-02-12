<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <p>
                    Welcome to Unipept Desktop! Please select a valid project folder or create a new project before continueing.
                </p>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col>
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <img src="@/assets/logo.svg" style="max-width: 200px;"/>
                    <span class="logo-headline">Unipept Desktop</span>
                    <span class="logo-subline">Version 0.0.1</span>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class HomePage extends Vue {

}
</script>

<style>
    .logo-headline {
        margin-top: 8px;
        font-size: 24px;
        color: black;
    }

    .logo-subline {
        font-size: 16px;
        color: #777;
    }
</style>