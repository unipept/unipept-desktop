export default interface Configuration {
    maxLongRunningTasks: number;
    maxParallelRequests: number;
    dockerConfigurationSettings: string;
    customDbStorageLocation: string;
}
