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
                <div
                    v-if="isAppLoading"
                >
                    <div class="d-flex flex-column align-center mt-4">
                        <v-progress-circular 
                            indeterminate 
                            color="primary"
                            size="50"
                            width="5"
                        />
                        <span class="mt-4">
                            Starting the application...
                        </span>
                    </div>
                </div>

                <div 
                    v-else-if="isUnrecoverableError" 
                    class="ma-4"
                >
                    <!-- Load configuration error -->
                    <error-alert
                        v-if="isLoadConfigError"
                        :error-message="loadConfigErrorMessage" 
                    >
                        Could not load existing configuration.
                        Please restart the application, reset the configuration or contact us if the problem persists.
                        <template #actions>
                            <div class="mt-2 float-right">
                                <v-btn @click="resetConfiguration">
                                    Reset configuration
                                </v-btn>
                            </div>
                        </template>
                    </error-alert>
                </div>

                <router-view 
                    v-else
                    v-slot="{ Component }"
                >
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
import ErrorAlert from "./components/alerts/ErrorAlert.vue";
import { intializeConfigurationStore } from "@renderer/stores/ConfigurationStore";
import { computed, ref } from "vue";

const isLoadConfigError = ref(false);
const loadConfigErrorMessage = ref("");

const isAppLoading = ref(true);

const initializeApplication = async function() {
    isAppLoading.value = true;
    isLoadConfigError.value = false;
    try {
        await intializeConfigurationStore();
    } catch (error) {
        loadConfigErrorMessage.value = (error as any).toString();
        isLoadConfigError.value = true;
    } finally {
        isAppLoading.value = false;
    }
};

const isUnrecoverableError = computed(() => {
    return isLoadConfigError.value;
});

const resetConfiguration = async function() {
    await window.api.config.resetConfiguration();
    await initializeApplication();
};

initializeApplication();
</script>

<style lang="less">
a {
    color: #1976d2;
    text-decoration: none;
    cursor: pointer;
}
</style>
