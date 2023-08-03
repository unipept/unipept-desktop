import ApplicationMigration from "@/logic/application/ApplicationMigration";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import ApplicationMigrationPreviousToV200alpha1 from "@/logic/application/ApplicationMigrationPreviousToV200alpha1";

export default class ApplicationMigrator {
    public async runMigrations(): Promise<void> {
        const configManager = new ConfigurationManager();
        const config = await configManager.readConfiguration();

        // This key was only introduced in v2.0.0-alpha.1 of the application. If it's not present or invalid, we need
        // to run the corresponding migration.
        if (!config.configurationAppVersion) {
            const migration = new ApplicationMigrationPreviousToV200alpha1();
            await migration.upgrade();
        }
    }
}
