<template>
    <div
        id="app"
        style="min-height: 100vh;"
    >
        <v-app style="min-height: 100%;">
            <v-app-bar
                app
                dark
                color="primary"
                :elevation="0"
            >
                <v-toolbar-title>Unipept Desktop</v-toolbar-title>
            </v-app-bar>

            <navigation-drawer />
            <v-main>
                <router-view v-slot="{ Component }">
                    <template v-if="Component">
                        <Suspense>
                            <!-- Main content of the application -->
                            <component :is="Component" />

                            <!-- Loading state of the application -->
                            <template #fallback>
                                <div class="d-flex flex-column align-center mt-4">
                                    <v-progress-circular 
                                        indeterminate 
                                        color="primary"
                                        size="50"
                                        width="5"
                                    />
                                    <span class="mt-4">
                                        Loading...
                                    </span>
                                </div>
                            </template>
                        </Suspense>
                    </template>
                </router-view>
            </v-main>
        </v-app>
    </div>
</template>

<script setup lang="ts">
import NavigationDrawer from "@renderer/components/navigation/NavigationDrawer.vue";

</script>

<style lang="less">
a {
    color: #1976d2;
    text-decoration: none;
    cursor: pointer;
}
</style>
