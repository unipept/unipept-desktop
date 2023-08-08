<template>
    <v-navigation-drawer
        rail
        permanent
    >
        <v-list
            nav
            class="full-height d-flex flex-column"
        >
            <v-list-item
                prepend-icon="mdi-home"
                title="Home"
                link
                to="/"
            >
                <v-tooltip
                    activator="parent"
                    location="end"
                >
                    Home
                </v-tooltip>
            </v-list-item>
            <v-list-item
                prepend-icon="mdi-test-tube"
                title="Single assay analysis"
                link
            >
                <v-tooltip
                    activator="parent"
                    location="end"
                >
                    Single assay analysis
                </v-tooltip>
            </v-list-item>
            <v-list-item
                prepend-icon="$test-multiple"
                title="Comparative analysis"
                link
            >
                <v-tooltip
                    activator="parent"
                    location="end"
                >
                    Comparative analysis
                </v-tooltip>
            </v-list-item>

            <v-spacer />

            <v-list-item
                prepend-icon="mdi-bacteria"
                title="Single peptide analysis"
                link
            >
                <v-tooltip
                    activator="parent"
                    location="end"
                >
                    Single peptide analysis
                </v-tooltip>
            </v-list-item>
            <v-list-item
                prepend-icon="mdi-cog"
                title="Settings"
                link
                to="/settings"
            >
                <v-tooltip
                    activator="parent"
                    location="end"
                >
                    Settings
                </v-tooltip>
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup lang="ts">

</script>

<style scoped>
    .full-height {
        height: 100%;
    }
</style>
