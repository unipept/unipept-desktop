import Configuration from '@common/configuration/Configuration';
import { defineStore } from 'pinia'
import { Ref, ref } from "vue";

export const intializeConfigurationStore = async () => {
    const currentConfig = await window.api.config.readConfiguration();

    const useConfigurationStore = defineStore('configuration', () => {
        const dbStorageLocation: Ref<string> = ref(currentConfig.customDbStorageLocation);
        const maxParallelRequests: Ref<number> = ref(currentConfig.maxParallelRequests);
        const dockerConfiguration: Ref<string> = ref(currentConfig.dockerConfigurationSettings);
        const customEndpoints: Ref<string[]> = ref(currentConfig.apiEndpoints);

        // Public getters
        const updateConfiguration = function(config: Configuration): Promise<void> {
            updateConfigRefs(config);
            return window.api.config.writeConfiguration(config);
        }

        const resetConfiguration = async function(): Promise<void> {
            const originalConfig = await window.api.config.resetConfiguration();
            updateConfigRefs(originalConfig);
        }

        // Private functions
        const updateConfigRefs = function(config: Configuration) {
            dbStorageLocation.value = config.customDbStorageLocation;
            maxParallelRequests.value = config.maxParallelRequests;
            dockerConfiguration.value = config.dockerConfigurationSettings;
            customEndpoints.value = config.apiEndpoints;
        }
    
        return {
            // Getters
            dbStorageLocation,
            maxParallelRequests,
            dockerConfiguration,
            customEndpoints,

            // Actions
            updateConfiguration,
            resetConfiguration
        }
    });

    return useConfigurationStore();
}