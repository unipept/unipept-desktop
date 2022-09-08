import ApplicationMigration from "@/logic/application/ApplicationMigration";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import { app } from "@electron/remote";

/**
 * The default path of the application that's used for storing custom databases changed in version 2.0.0-alpha.1 of
 * the application and needs to be reset here.
 */
export default class ApplicationMigrationPreviousToV200alpha1 implements ApplicationMigration {
    public async upgrade(): Promise<void> {
        // Reset the configuration back to the default value.
        const configManager = new ConfigurationManager(app);
        const defaultConfig = await configManager.getDefaultConfiguration();
        await configManager.writeConfiguration(defaultConfig);
    }
}
