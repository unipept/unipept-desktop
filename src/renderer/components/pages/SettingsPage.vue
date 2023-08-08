<template>
    <v-form ref="settingsForm">
        <div class="settings-container mt-4">
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

            <!-- Update configuration error -->
            <error-alert
                v-if="isUpdateConfigError"
                :error-message="updateConfigError" 
            >
                Could not update the configuration of this application.
                Please restart the application or contact us if the problem persists.
            </error-alert>

            <v-snackbar
                v-model="isSuccessfulUpdateSnackbarActive"
                :timeout="2000"
                color="success"
            >
                Application configuration has successfully been updated.
            </v-snackbar>

            <h2 class="mx-auto settings-category-title">
                Connectivity
            </h2>
            <v-card>
                <v-card-text>
                    <v-container fluid>
                        <v-row>
                            <v-col cols="10">
                                <div class="settings-title">
                                    Concurrent API requests
                                </div>
                                <span class="settings-text">
                                    How many API requests can be performed in parallel? This setting controls the max amount
                                    of requests to the API server that can be performed in parallel. Increasing this value
                                    can lead to a faster analysis. Setting it too high could however cause stability issues
                                    on the server side.
                                </span>
                            </v-col>
                            <v-col cols="2">
                                <v-text-field
                                    v-model="maxParallelRequests"
                                    label="5"
                                    single-line
                                    filled
                                    type="number"
                                    required
                                    :rules="maxRequestRules"
                                />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <div class="settings-title">
                                    Custom endpoints
                                </div>
                                <span class="settings-text">
                                    You can add custom endpoints to this application that can be selected
                                    as an "analysis source" while performing an analysis. These endpoints
                                    are typically mirrors of Unipept's online service that have been set
                                    up by you or other third parties.
                                </span>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <div class="d-flex align-center mb-4">
                                    <v-text-field
                                        v-model="newEndpointValue"
                                        class="mr-2"
                                        density="compact"
                                        hide-details 
                                    />
                                    <v-btn 
                                        color="primary"
                                        :disabled="!isValidNewEndpointValue"
                                        @click="addEndpoint"
                                    >
                                        Add endpoint
                                    </v-btn>
                                </div>
                                <v-table>
                                    <thead>
                                        <tr>
                                            <th class="text-left">
                                                Endpoint URL
                                            </th>
                                            <th class="text-center">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr 
                                            v-for="(endpoint, index) in customEndpoints" 
                                            :key="index"
                                        >
                                            <td>{{ endpoint }}</td>
                                            <td class="text-center">
                                                <v-btn
                                                    icon="mdi-delete"
                                                    size="x-small"
                                                    color="error"
                                                    variant="tonal"
                                                    :disabled="endpoint === 'https://api.unipept.ugent.be'"
                                                    @click="removeEndpoint(index)"
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
            </v-card>

            <h2 class="mx-auto settings-category-title">
                Storage
            </h2>
            <v-card>
                <v-card-text>
                    <v-container fluid>
                        <v-row>
                            <v-col cols="8">
                                <div class="settings-title">
                                    Database storage location
                                </div>
                                <div class="settings-text">
                                    Indicates where the application should store custom database files? Note
                                    that these files can grow quite large in size, depending on the amount
                                    and size of the custom databases you are planning to use. For large
                                    databases, at least 100GiB of free space is required.
                                </div>
                                <span class="settings-text settings-important-text">
                                    NOTE: Only database metadata will be stored in this location on Windows
                                    based systems due to a bug in Windows' implementation of Docker. Follow
                                    <a @click="openInBrowser('https://dev.to/kimcuonthenet/move-docker-desktop-data-distro-out-of-system-drive-4cg2')">this guide</a> 
                                    if you need to change the default storage location of Docker volume's nonetheless.
                                </span>
                            </v-col>
                            <v-col cols="4">
                                <v-text-field
                                    v-model="customDbStorageLocation"
                                    single-line
                                    filled
                                    readonly
                                    :rules="customDbStorageLocationRules"
                                    prepend-inner-icon="mdi-folder-outline"
                                    @click="updateDbStorageLocation" 
                                />
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
            </v-card>

            <h2 class="mx-auto settings-category-title">
                Docker
            </h2>
            <v-card>
                <v-card-text>
                    <v-container fluid>
                        <v-row>
                            <v-col cols="12">
                                <span class="settings-text">
                                    This application requires a connection with a local Docker installation
                                    in order to provide custom protein database functionality. If you
                                    currently don't have Docker installed locally, you can download it for
                                    free from <a @click="openInBrowser('https://www.docker.com/products/docker-desktop')">the Docker website</a>.
                                    We recommend using Docker Desktop, which automatically comes with
                                    Docker Engine (which in turn is required by this application in order
                                    to allow easy communication with the Docker daemon.
                                </span>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <div class="settings-title">
                                    Connection settings
                                </div>
                                <span class="settings-text">
                                    Provide a valid configuration that's required to connect to your local
                                    Docker installation. All valid configuration options, that will be
                                    accepted by this application can be found
                                    <a @click="openInBrowser('https://github.com/apocas/dockerode#getting-started')">here</a>. 
                                    Please note that the default settings provided by this
                                    application work in most cases, you only need to change this
                                    configuration if no connection to your local Docker installation can be
                                    made.
                                </span>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <v-textarea 
                                    v-model="dockerConnectionSettings"
                                    filled 
                                    :rules="dockerConfigRules" 
                                    :rows="2"
                                />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <div class="settings-title">
                                    Docker availability
                                </div>
                                <!-- <a class="settings-link" @click="retrieveDockerInfo">
                                    Click to refresh status
                                </a> -->
                            </v-col>
                        </v-row>
                        <!-- <v-row>
                            <v-col 
                                cols="12" style="min-height: 132px;">
                                <div v-if="dockerInfoLoading" class="d-flex flex-column align-center">
                                    <v-progress-circular color="primary" indeterminate></v-progress-circular>
                                    <span>Checking connection with Docker</span>
                                </div>
                                <div v-else class="d-flex">
                                    <div style="max-width: 120px;" class="ml-4 mr-8">
                                        <v-img v-if="dockerInfo" src="@renderer/assets/images/docker/docker_available.svg"/>
                                        <v-img v-else src="@renderer/assets/images/docker/docker_na.svg"/>
                                    </div>
                                    <div class="settings-text" v-if="dockerInfo">
                                        <div>
                                            <strong>Architecture:</strong> {{ dockerInfo.Architecture }}
                                        </div>
                                        <div>
                                            <strong>CPUs available:</strong> {{ dockerInfo.NCPU }}
                                        </div>
                                        <div>
                                            <strong>Total memory available: </strong>
                                            {{ dockerInfo.MemTotal }} bytes
                                            ({{ (dockerInfo.MemTotal / (Math.pow(2,30))).toFixed(2) }} GiB)
                                        </div>
                                        <div>
                                            <strong>OS type:</strong>
                                            {{ dockerInfo.OSType }} ({{ dockerInfo.KernelVersion }})
                                        </div>
                                        <div>
                                            <strong>Docker server version:</strong>
                                            {{ dockerInfo.ServerVersion }}
                                        </div>
                                        <div>
                                            <strong>ID:</strong> {{ dockerInfo.ID }}
                                        </div>
                                    </div>
                                    <span class="settings-text" v-else>
                                        We were unable to connect to your local Docker installation. Please
                                        verify that Docker engine has been properly installed on your
                                        system, that it is currently running and that the configuration
                                        provided above is correct. Remember to check your firewall settings
                                        if Docker seems to be running perfectly, but no connection can be
                                        established.
                                    </span>
                                </div>
                            </v-col>
                        </v-row> -->
                    </v-container>
                </v-card-text>
            </v-card>

            <div class="my-4 float-end">
                <v-btn
                    color="error"
                    class="mr-2"
                    @click="resetConfiguration"
                >
                    Reset to defaults
                </v-btn>
                <v-btn 
                    color="primary"
                    :loading="isFormValidating"
                    :disabled="isFormDisabled"
                    @click="updateConfiguration"
                >
                    Save changes
                </v-btn>
            </div>
        </div>
    </v-form>
</template>

<script setup lang="ts">
import FormValidation from "@renderer/logic/form/validation/FormValidation";
import { intializeConfigurationStore } from "@renderer/stores/ConfigurationStore";
import { Ref, ref, computed } from "vue";
import { VForm } from "vuetify/components";
import ErrorAlert from "@renderer/components/alerts/ErrorAlert.vue";
import { openInBrowser } from "@renderer/logic/utils/BrowserUtils";

const maxRequestRules: ((x: string) => boolean | string)[] = [
    FormValidation.required,
    FormValidation.integer,
    FormValidation.gtZero,
    FormValidation.lteTen
];

const customDbStorageLocationRules: ((x: string) => boolean | string)[] = [
    FormValidation.required
];

const dockerConfigRules: ((x: string) => boolean | string)[] = [
    FormValidation.required,
    FormValidation.json
];

const settingsForm: Ref<VForm | null> = ref(null);

const isFormValid = computed(() => {
    if (settingsForm.value !== null) {
        return settingsForm.value.isValid;
    }
    return false;
});

const isFormValidating = computed(() => {
    if (settingsForm.value !== null) {
        return settingsForm.value.isValidating;
    }
    return false;
});

const isFormDisabled = computed(() => {
    return !(isFormValid.value) || isLoadConfigError.value;
});

const maxParallelRequests: Ref<string | null> = ref(null);
const customDbStorageLocation: Ref<string | null> = ref(null);
const dockerConnectionSettings: Ref<string | null> = ref(null);
const customEndpoints: Ref<string[] | null> = ref(null);

const isLoadConfigError = ref(false);
const loadConfigErrorMessage = ref("");

const loadExistingConfiguration = async function() {
    try {
        isLoadConfigError.value = false;
        const configurationStore = await intializeConfigurationStore();

        maxParallelRequests.value = configurationStore.maxParallelRequests.toString();
        customDbStorageLocation.value = configurationStore.dbStorageLocation;
        dockerConnectionSettings.value = configurationStore.dockerConfiguration;
        customEndpoints.value = configurationStore.customEndpoints;
    } catch (error) {
        loadConfigErrorMessage.value = (error as any).toString();
        isLoadConfigError.value = true;
    }
}

const isUpdateConfigError = ref(false);
const updateConfigError = ref("");
const isSuccessfulUpdateSnackbarActive = ref(false);

const updateConfiguration = async function() {
    try {
        isUpdateConfigError.value = false;
        const configurationStore = await intializeConfigurationStore();
        await configurationStore.updateConfiguration({
            maxParallelRequests: Number.parseInt(maxParallelRequests.value!),
            customDbStorageLocation: customDbStorageLocation.value!,
            dockerConfigurationSettings: dockerConnectionSettings.value!,
            apiEndpoints: [...customEndpoints.value!]
        });
        isSuccessfulUpdateSnackbarActive.value = true;
    } catch (error) {
        isUpdateConfigError.value = true;
        updateConfigError.value = (error as any).toString() + (error as Error).stack;
    }
}

const resetConfiguration = async function() {
    await window.api.config.resetConfiguration();
    await loadExistingConfiguration();
}

const updateDbStorageLocation = async function() {
    const newDbLocation = await window.api.dialog.showFolderPickerDialog();
    if (newDbLocation !== undefined) {
        customDbStorageLocation.value = newDbLocation[0];
    }
}

const newEndpointValue: Ref<string> = ref("");

const isValidNewEndpointValue = computed(() => {
    return newEndpointValue.value !== "";
});

const addEndpoint = function() {
    if (newEndpointValue.value !== "") {
        customEndpoints.value?.push(newEndpointValue.value);
    }
}

const removeEndpoint = function(idx: number) {
    customEndpoints.value?.splice(idx, 1);
}

await loadExistingConfiguration();

</script>

<style scoped>
.settings-container {
    max-width: 1400px;
    margin: auto;
}

.settings-title {
    color: black;
    font-size: 18px;
}

.settings-important-text {
    font-style: italic;
    font-weight: bold;
    display: block;
}

.settings-category-title:not(:first-child) {
    margin-top: 32px;
}

.font-monospace {
    font-family: 'Courier New', monospace;
}
.error-details {
    background-color: #333;
}
</style>
