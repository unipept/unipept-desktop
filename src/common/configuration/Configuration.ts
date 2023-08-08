export default interface Configuration {
    maxParallelRequests: number;
    dockerConfigurationSettings: string;
    customDbStorageLocation: string;
    apiEndpoints: string[]
}
