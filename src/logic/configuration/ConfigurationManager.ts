import Configuration from "./Configuration";
// We must use Node's FileSystem API to read files, as HTML5 file reader cannot be used to read files
// from a specified path.
import { promises as fs } from 'fs';

export default class ConfigurationManager {
    // The name of the file that's used to store the settings in.
    private static readonly CONFIG_FILE_NAME = "unipept.config";
    // This is the default configuration object that's used as a fallback for inconsistent/inavailable configuration
    // values.
    private static readonly DEFAULT_CONFIG: Configuration = {
        apiSource: 'http://localhost:3000'
    };

    // Contains a function for every field of a Configuration object that checks whether it's valid or not.
    private configurationRequirements: ((x: Configuration) => boolean)[] = [
        (config: Configuration) => this.isUrl(config.apiSource)
    ]

    /**
     * Reads the currently used configuration from the user data folder for this application. This method guarantees
     * that no invalid configuration settings are set in the resulting object. If an invalid setting is found or not
     * configuration file could be read, the default value will be used instead.
     */
    public async readConfiguration(): Promise<Configuration> {
        let data = await fs.readFile(this.getConfigurationFilePath());
    
        console.log(data);

        return ConfigurationManager.DEFAULT_CONFIG;
    }

    public async writeConfiguration(config: Configuration): Promise<void> {
        

    }

    /**
     * Checks whether all fields of the given Configuration object adhere to the required formats. Returns true if this
     * is a valid object, false otherwise.
     * 
     * @param config A Configuration object that should be checked for validity.
     * @return True if the given Configuration is valid.
     */
    private isValidConfiguration(config: Configuration): boolean {
        for (let test of this.configurationRequirements) {
            if (!test(config)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Tests if the given string is a valid URL.
     * 
     * @param url The string for which should be checked if it is a valid URL.
     * @return True if the given string is a valid URL.
     */
    private isUrl(url: string): boolean {
        // See https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url/49849482
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return pattern.test(url);
    }

    private getConfigurationFilePath(): string {
        const remote = require('remote');
        const app = remote.require('app');
        // Get a reference to the user data folder in which configuration data will be stored.
        const configurationFolder = app.getPath('userData');
        return configurationFolder + ConfigurationManager.CONFIG_FILE_NAME;
    } 
}
