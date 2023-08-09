import { app } from "electron";
import path from "path";
import FileSystemManager from "../file-system/FileSystemManager";
import Configuration from "@common/configuration/Configuration";
import OperatingSystemUtils from "../utils/OperatingSystemUtils";

export default class ConfigurationManager {
    private static readonly CONFIG_FILE_NAME = "unipept.config";

    private static readonly DOCKER_UNIX_DEFAULT_SETTINGS = JSON.stringify({
        socketPath: "/var/run/docker.sock"
    });
    
    private static readonly DOCKER_WINDOWS_DEFAULT_SETTINGS = JSON.stringify({
        socketPath: "//./pipe/docker_engine"
    });

    private readonly configurationRules: ((x: Configuration) => boolean)[] = [
        (config: Configuration) => {
            return Number.isInteger(config.maxParallelRequests) &&
                config.maxParallelRequests <= 10 &&
                config.maxParallelRequests >= 1;
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
        (config: Configuration) => config.customDbStorageLocation !== "",
        // (config: Configuration) => config.apiEndpoints.every(e => FormValidation.url(e))
    ];

    public async readConfiguration(): Promise<Configuration> {
        const fsManager = new FileSystemManager();
        const configPath = this.getConfigurationFilePath();

        if (!(await fsManager.fileExists(configPath))) {
            return await this.createDefaultConfiguration();
        }

        const parsedConfig = JSON.parse(await fsManager.readFile(this.getConfigurationFilePath()));

        // Fill in missing properties with default config values.
        for (const [key, value] of Object.entries(await this.createDefaultConfiguration())) {
            if (!(key in parsedConfig)) {
                parsedConfig[key] = value;
            }
        }

        await this.isConfigurationValid(parsedConfig);

        return parsedConfig;
    }

    public async writeConfiguration(config: Configuration): Promise<void> {
        await this.isConfigurationValid(config);

        const fsManager = new FileSystemManager();
        return fsManager.writeFile(this.getConfigurationFilePath(), JSON.stringify(config));
    }

    public async resetConfiguration(): Promise<Configuration> {
        const defaultConfig = await this.createDefaultConfiguration();
        await this.writeConfiguration(defaultConfig);
        return defaultConfig;
    }

    private getConfigurationFilePath(): string {
        // Get a reference to the user data folder in which configuration data will be stored.
        const configurationFolder = app.getPath("userData");
        return configurationFolder + "/" + ConfigurationManager.CONFIG_FILE_NAME;
    }

    private async createDefaultConfiguration(): Promise<Configuration> {
        const homeDir = app.getPath("documents");
        const customDbDir = path.join(homeDir, "unipept", "data");

        const fsManager = new FileSystemManager();
        await fsManager.mkdir(customDbDir);

        return {
            maxParallelRequests: 4,
            dockerConfigurationSettings: OperatingSystemUtils.isWindows() ? 
                ConfigurationManager.DOCKER_WINDOWS_DEFAULT_SETTINGS : 
                ConfigurationManager.DOCKER_UNIX_DEFAULT_SETTINGS,
            customDbStorageLocation: customDbDir,
            apiEndpoints: [
                "https://api.unipept.ugent.be"
            ]
        };
    }

    private async isConfigurationValid(config: Configuration): Promise<void> {
        const missingKeys = Object.keys(await this.createDefaultConfiguration()).filter(key => !(key in config));
        if (missingKeys && missingKeys.length > 0) {
            throw new Error(
                "Provided configuration object missing properties: " + missingKeys.join(", ") + "." +
                "Original object is: " + JSON.stringify(config) + "."
            );
        }

        const missingRules = this.configurationRules.filter(rule => !rule(config));
        if (missingRules && missingRules.length > 0) {
            throw new Error(
                "Provided configuration values not satisfying constraints: " + missingRules.join(", ") + "." +
                "Original object is: " + JSON.stringify(config) + "."
            );
        }
    }
}
