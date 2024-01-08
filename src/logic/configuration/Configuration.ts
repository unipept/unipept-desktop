export default interface Configuration {
    maxLongRunningTasks: number;
    maxParallelRequests: number;
    dockerConfigurationSettings: string;
    customDbStorageLocation: string;
    // The version of the application that was used to create this configuration.
    configurationAppVersion: string;
    // List of custom Unipept endpoints that were provided to this app.
    endpoints: string[];
}
