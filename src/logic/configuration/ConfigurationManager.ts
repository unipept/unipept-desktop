import Configuration from "./Configuration";

export default class ConfigurationManager {
    // The name of the file that's used to store the settings in.
    private static readonly CONFIG_FILE_NAME = "unipept.config";
    // This is the default configuration object that's used as a fallback for inconsistent/inavailable configuration
    // values.
    private static readonly DEFAULT_CONFIG: Configuration = {
        apiSource: 'http://localhost:3000'
    };

    /**
     * Reads the currently used configuration from the user data folder for this application. This method guarantees
     * that no invalid configuration settings are set in the resulting object. If an invalid setting is found or not
     * configuration file could be read, the default value will be used instead.
     */
    public readConfiguration(): Configuration {
        const remote = require('remote');
        const app = remote.require('app');
        // Get a reference to the user data folder in which configuration data will be stored.
        const configurationFolder = app.getPath('userData');
        return ConfigurationManager.DEFAULT_CONFIG;
    }

    public writeConfiguration(config: Configuration): void {

    }
}
