import Configuration from "@common/configuration/Configuration";
import { defineStore } from "pinia";
import { Ref, ref } from "vue";

let initialConfig: Configuration; 

/**
 * Read the current configuration from file and initialize the configuration store based upon the current config values.
 * 
 * @throws Whenever the current configuration could not be read from the filesystem, or if the current configuration is
 * invalid. This should be fixed before allowing the application to continue.
 */
export const intializeConfigurationStore = async () => {
    initialConfig = await window.api.config.readConfiguration();
};

export const useConfigurationStore = defineStore("configuration", () => {
    if (!initialConfig) {
        throw new Error("Configuration store is not yet initialized! Call initalizeConfigurationStore first.");
    }

    const dbStorageLocation: Ref<string> = ref(initialConfig.customDbStorageLocation);
    const maxParallelRequests: Ref<number> = ref(initialConfig.maxParallelRequests);
    const dockerConfiguration: Ref<string> = ref(initialConfig.dockerConfigurationSettings);
    const customEndpoints: Ref<string[]> = ref(initialConfig.apiEndpoints);

    // Public getters
    const updateConfiguration = function(config: Configuration): Promise<void> {
        updateConfigRefs(config);
        return window.api.config.writeConfiguration(config);
    };

    const resetConfiguration = async function(): Promise<void> {
        const originalConfig = await window.api.config.resetConfiguration();
        updateConfigRefs(originalConfig);
    };

    // Private functions
    const updateConfigRefs = function(config: Configuration) {
        dbStorageLocation.value = config.customDbStorageLocation;
        maxParallelRequests.value = config.maxParallelRequests;
        dockerConfiguration.value = config.dockerConfigurationSettings;
        customEndpoints.value = config.apiEndpoints;
    };

    return {
        // State
        dbStorageLocation,
        maxParallelRequests,
        dockerConfiguration,
        customEndpoints,

        // Actions
        updateConfiguration,
        resetConfiguration
    };
});
