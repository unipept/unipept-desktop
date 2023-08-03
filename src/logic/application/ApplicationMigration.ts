/**
 * For each version upgrade of the application that requires changes to the existing configuration, a new migrator
 * that adheres to this interface can be implemented. This migrator will then be executed upon first opening a new
 * version of the application.
 */
export default interface ApplicationMigration {
    /**
     * This method is called when the application is updated from one version to the next. All changes to the
     * configuration of the application that apply to this specific version upgrade should be applied here.
     */
    upgrade(): Promise<void>;
}
