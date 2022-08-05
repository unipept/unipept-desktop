import Configuration from "./Configuration";
// We must use Node's FileSystem API to read files, as HTML5 file reader cannot be used to read files
// from a specified path.
import fs from "fs";
import path from "path";
import { App } from "electron";
import Utils from "@/logic/Utils";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";


export default class ConfigurationManager {
    // The name of the file that's used to store the settings in.
    private static readonly CONFIG_FILE_NAME = "unipept.config";
    // Reference to the last configuration that was returned by this manager. Can be used to update the current
    // configuration and write the changes to disk (without having to read it again).
    private static currentConfiguration: Configuration = null;

    // Contains a function for every field of a Configuration object that checks whether it's valid or not.
    private configurationRequirements: ((x: Configuration) => boolean)[] = [
        (config: Configuration) => Number.isInteger(config.maxLongRunningTasks) && config.maxLongRunningTasks >= 1,
        (config: Configuration) => {
            return Number.isInteger(config.maxParallelRequests) &&
                config.maxParallelRequests <= 10 &&
                config.maxParallelRequests >= 1
        },
        (config: Configuration) => {
            // Check if the given Docker-config value is a valid JSON object.
            try {
                JSON.parse(config.dockerConfigurationSettings);
                return true;
            } catch (e) {
                return false;
            }
        },
        (config: Configuration) => config.customDbStorageLocation !== ""
    ]

    private app: App;

    public constructor(app: App = null) {
        this.app = app;
    }

    /**
     * Reads the currently used configuration from the user data folder for this application. This method guarantees
     * that no invalid configuration settings are set in the resulting object. If an invalid setting is found or the
     * configuration file could not be read, the default value will be used instead.
     *
     * @return A valid Configuration object with the most recent settings found on disk.
     */
    public async readConfiguration(): Promise<Configuration> {
        if (ConfigurationManager.currentConfiguration) {
            return ConfigurationManager.currentConfiguration;
        }

        try {
            let rawConfig = fs.readFileSync(this.getConfigurationFilePath(), { encoding: "utf-8" });
            let data = JSON.parse(rawConfig);
            if (!this.isValidConfiguration(data)) {
                ConfigurationManager.currentConfiguration = this.getDefaultConfiguration();
                return ConfigurationManager.currentConfiguration;
            }
            ConfigurationManager.currentConfiguration = data;
            return data;
        } catch (err) {
            return this.getDefaultConfiguration();
        }
    }

    public getDefaultConfiguration(): Configuration {
        const homeDir = this.app.getPath("home");

        return {
            maxLongRunningTasks: 8,
            maxParallelRequests: 3,
            dockerConfigurationSettings:
                Utils.isWindows() ? DockerCommunicator.WINDOWS_DEFAULT_SETTINGS : DockerCommunicator.UNIX_DEFAULT_SETTINGS,
            customDbStorageLocation: path.join(homeDir, "unipept", "data")
        }
    }

    /**
     * Write a valid Configuration object to disk. This function also checks the given object for validity. A
     * static, predefined location will be used to store this Configuration.
     *
     * @param config The Configuration object that should be stored to disk.
     * @throws InvalidConfigurationException when the given config is invalid.
     * @throws IOException when something went wrong during write of this file to disk.
     */
    public async writeConfiguration(config: Configuration): Promise<void> {
        if (!this.isValidConfiguration(config)) {
            throw "InvalidConfigurationException";
        }

        try {
            fs.writeFileSync(this.getConfigurationFilePath(), JSON.stringify(config), { encoding: "UTF-8" });
            ConfigurationManager.currentConfiguration = config;
        } catch (err) {
            throw "IOException";
        }
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
        const pattern = new RegExp("^(https?:\\/\\/)?"+ // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|"+ // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))"+ // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*"+ // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?"+ // query string
            "(\\#[-a-z\\d_]*)?$","i"); // fragment locator
        return pattern.test(url);
    }

    private getConfigurationFilePath(): string {
        if (!this.app) {
            const { app } = require("electron").remote;
            this.app = app;
        }

        // Get a reference to the user data folder in which configuration data will be stored.
        const configurationFolder = this.app.getPath("userData");
        return configurationFolder + "/" + ConfigurationManager.CONFIG_FILE_NAME;
    }
}
