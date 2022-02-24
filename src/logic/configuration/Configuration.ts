export default interface Configuration {
    apiSource: string;
    useNativeTitlebar: boolean;
    maxLongRunningTasks: number;
    maxParallelRequests: number;
    dockerConfigurationSettings: string;
    customDbStorageLocation: string;
}
