import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { ActionContext, ActionTree, GetterTree, Module, MutationTree } from "vuex";
import { NcbiId } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import Configuration from "@/logic/configuration/Configuration";
import * as path from "path";
import CustomDatabaseManager from "@/logic/filesystem/docker/CustomDatabaseManager";

export interface CustomDatabaseState {
    databases: CustomDatabase[],
    // Is the construction process for at least one database currently in progress?
    constructionInProgress: boolean
}

export default class CustomDatabaseStoreFactory {
    private configuration: Configuration;
    private customDbManager: CustomDatabaseManager;

    public constructCustomDatabaseStore(): Module<CustomDatabaseState, any> {
        const databaseState: CustomDatabaseState = {
            databases: [],
            constructionInProgress: false
        }

        const databaseGetters: GetterTree<CustomDatabaseState, any> = {
            databases(state: CustomDatabaseState): CustomDatabase[] {
                return state.databases;
            },

            database(state: CustomDatabaseState): (dbName: string) => CustomDatabase | undefined {
                return (dbName: string) => state.databases.find(d => d.name === dbName);
            },

            constructionInProgress(state: CustomDatabaseState): boolean {
                return state.constructionInProgress;
            }
        }

        const databaseMutations: MutationTree<CustomDatabaseState> = {
            CUSTOM_DB_ADD_DATABASE(
                state: CustomDatabaseState,
                [
                    dbName,
                    databaseTypes,
                    databaseSources,
                    taxa,
                    dbVersion
                ]: [
                    string,
                    string[],
                    string[],
                    NcbiId[],
                    string
                ]
            ) {
                const db = new CustomDatabase(
                    dbName,
                    databaseSources,
                    databaseTypes,
                    taxa,
                    dbVersion
                );

                state.databases.push(db);
            },

            CUSTOM_DB_ADD_DATABASE_OBJECT(
                state: CustomDatabaseState,
                dbObject: CustomDatabase
            ) {
                state.databases.push(dbObject);
            },

            CUSTOM_DB_REMOVE_DATABASE(
                state: CustomDatabaseState,
                database: CustomDatabase
            ) {
                const index = state.databases.findIndex(db => db.name === database.name);

                if (index !== -1) {
                    state.databases.splice(index, 1);
                }
            },

            CUSTOM_DB_UPDATE_PROGRESS(
                state: CustomDatabaseState,
                [database, value, progress_step]: [CustomDatabase, number, number]
            ) {
                const dbObj = state.databases.find(db => db.name === database.name);
                dbObj.progress.currentValue = value;
                dbObj.progress.currentStep = progress_step;

                const time = new Date().getTime();

                for (let i = progress_step - 1; i >= 0; i--) {
                    if (dbObj.progress.endTimes[i] === 0) {
                        dbObj.progress.endTimes[i] = time;
                    }

                    if (dbObj.progress.startTimes[i] === 0) {
                        dbObj.progress.startTimes[i] = time;
                    }
                }

                if (dbObj.progress.startTimes[progress_step] === 0) {
                    dbObj.progress.startTimes[progress_step] = time;
                }
            },

            CUSTOM_DB_UPDATE_LOG(
                state: CustomDatabaseState,
                [database, logLine]: [CustomDatabase, string]
            ) {
                const dbObj = state.databases.find(db => db.name === database.name);
                dbObj.progress.logs.push(logLine);
            },

            CUSTOM_DB_RESET_LOG(
                state: CustomDatabaseState,
                database: CustomDatabase
            ) {
                const dbObj = state.databases.find(db => db.name === database.name);
                dbObj.progress.logs.splice(0, dbObj.progress.logs.length);
            },

            CUSTOM_DB_UPDATE_READY_STATUS(
                state: CustomDatabaseState,
                [database, status]: [CustomDatabase, boolean]
            ) {
                const dbObj = state.databases.find(db => db.name === database.name);
                const progressObj = dbObj.progress;

                const time = new Date().getTime();

                if (status) {
                    // Store end time for the last progress
                    for (let i = 0; i < progressObj.steps.length; i++) {
                        if (progressObj.startTimes[i] === 0) {
                            progressObj.startTimes[i] = time;
                        }

                        if (progressObj.endTimes[i] === 0) {
                            progressObj.endTimes[i] = time;
                        }
                    }

                    progressObj.currentStep = progressObj.steps.length + 1;
                } else {
                    // Reset progress values
                    for (let i = 0; i < progressObj.steps.length; i++) {
                        progressObj.startTimes[i] = 0;
                        progressObj.endTimes[i] = 0;
                    }

                    progressObj.startTimes[0] = new Date().getTime();
                    progressObj.currentStep = 0;
                    progressObj.currentValue = -1;
                }

                dbObj.ready = status;
            },

            CUSTOM_DB_UPDATE_ERROR(
                state: CustomDatabaseState,
                [database, errorStatus, errorMsg, errorObj]: [CustomDatabase, boolean, string, Error]
            ) {
                const dbObj = state.databases.find(db => db.name === database.name);
                dbObj.error.status = errorStatus;
                dbObj.error.message = errorMsg;
                dbObj.error.object = errorObj;
            },

            CUSTOM_DB_UPDATE_GLOBAL_CONSTRUCTION_STATUS(
                state: CustomDatabaseState,
                inProgress: boolean
            ) {
                state.constructionInProgress = inProgress;
            },

            CUSTOM_DB_UPDATE_CANCELLATION_STATUS(
                state: CustomDatabaseState,
                [database, cancellationStatus]: [CustomDatabase, boolean]
            ) {
                const dbObj = state.databases.find(db => db.name === database.name);
                dbObj.cancelled = cancellationStatus;
            }
        }

        const databaseActions: ActionTree<CustomDatabaseState, any> = {
            buildDatabase: {
                root: false,
                handler: async(
                    store: ActionContext<CustomDatabaseState, any>,
                    [
                        dbName,
                        databaseTypes,
                        databaseSources,
                        taxa,
                        uniprotVersion
                    ]: [
                        string,
                        string[],
                        string[],
                        NcbiId[],
                        string
                    ]
                ) => {
                    await this.buildDatabase(
                        store,
                        [dbName, databaseTypes, databaseSources, taxa, uniprotVersion]
                    );
                }
            },

            stopDatabase: {
                root: false,
                handler: async(
                    store: ActionContext<CustomDatabaseState, any>,
                    dbName: string
                ) => {
                    await this.stopDatabase(store, dbName);
                }
            },

            reanalyzeDatabase: {
                root: false,
                handler: async(
                    store: ActionContext<CustomDatabaseState, any>,
                    dbName: string
                ) => {
                    await this.reanalyzeDatabase(store, dbName);
                }
            },

            deleteDatabase: {
                root: false,
                handler: async(
                    store: ActionContext<CustomDatabaseState, any>,
                    dbName: string
                ) => {
                    await this.deleteDatabase(store, dbName);
                }
            },

            /**
             * Reads all databases from disk and initializes this store. The databases that have already been processed
             * correctly before, will not be processed again.
             */
            initializeDatabaseQueue: {
                root: false,
                handler: async(
                    store: ActionContext<CustomDatabaseState, any>,
                    config: Configuration
                ) => {
                    await this.initializeDatabaseQueue(store, config);
                }
            }
        }

        return {
            namespaced: true,
            state: databaseState,
            getters: databaseGetters,
            mutations: databaseMutations,
            actions: databaseActions
        }
    }

    private async startDatabaseConstruction(
        store: ActionContext<CustomDatabaseState, any>,
        customDb: CustomDatabase
    ): Promise<void> {
        store.commit("CUSTOM_DB_UPDATE_GLOBAL_CONSTRUCTION_STATUS", true);
        customDb.inProgress = true;

        try {
            const dbPath = path.join(this.configuration.customDbStorageLocation);

            const dockerCommunicator = new DockerCommunicator(dbPath);

            await dockerCommunicator.buildDatabase(
                customDb,
                path.join(this.configuration.customDbStorageLocation, "index"),
                path.join(this.configuration.customDbStorageLocation, "temp"),
                (step, value, progress_step) => {
                    store.commit("CUSTOM_DB_UPDATE_PROGRESS", [customDb, value, progress_step]);
                    this.updateMetadata(customDb);
                },
                (line: string) => {
                    store.commit("CUSTOM_DB_UPDATE_LOG", [customDb, line]);
                    this.updateMetadata(customDb);
                }
            );

            if (customDb.progress.logs.filter(x => x.includes("mariadbd: Shutdown complete")).length > 0) {
                customDb.sizeOnDisk = await dockerCommunicator.getDatabaseSize(customDb.name);
                store.commit("CUSTOM_DB_UPDATE_READY_STATUS", [customDb, true]);
            } else {
                const err = new Error("Status of container was changed outside of application.");
                store.commit("CUSTOM_DB_UPDATE_ERROR", [
                    customDb,
                    true,
                    err.stack,
                    err
                ]);
            }
        } catch (err) {
            store.commit("CUSTOM_DB_UPDATE_ERROR", [
                customDb,
                true,
                err.stack,
                err
            ]);
        } finally {
            customDb.inProgress = false;
            store.commit("CUSTOM_DB_UPDATE_GLOBAL_CONSTRUCTION_STATUS", false);
            await this.updateMetadata(customDb);
        }
    }

    private async initializeDatabaseQueue(
        store: ActionContext<CustomDatabaseState, any>,
        config: Configuration
    ): Promise<void> {
        this.configuration = config;

        this.customDbManager = new CustomDatabaseManager();
        const dbList = await this.customDbManager.listAllDatabases(this.configuration.customDbStorageLocation);

        for (const db of dbList) {
            store.commit("CUSTOM_DB_ADD_DATABASE_OBJECT", db);
        }

        const dockerCommunicator = new DockerCommunicator(this.configuration.customDbStorageLocation);

        setInterval(
            async() => {
                if (
                    !store.getters.constructionInProgress
                ) {
                    // If no databases are currently being constructed, and at least one database is
                    // waiting in the queue, we should start the construction process for this database.
                    const scheduledDatabases = store.getters.databases.filter(
                        (db: CustomDatabase) => !db.ready && !db.error.status
                    );

                    if (scheduledDatabases.length > 0) {
                        await this.startDatabaseConstruction(
                            store,
                            scheduledDatabases[0]
                        );
                    }
                }
            },
            1000
        );
    }

    private async deleteDatabase(
        store: ActionContext<CustomDatabaseState, any>,
        dbName: string
    ): Promise<void> {
        const dbObj = store.getters.database(dbName);

        // First try to remove the database from the filesystem
        const customDbManager = new CustomDatabaseManager();
        customDbManager.deleteDatabase(
            this.configuration.customDbStorageLocation,
            dbObj
        ).then(() => store.commit("CUSTOM_DB_REMOVE_DATABASE", dbObj));
    }

    private async reanalyzeDatabase(
        store: ActionContext<CustomDatabaseState, any>,
        dbName: string
    ): Promise<void> {
        const dbObj = store.getters.database(dbName);

        store.commit("CUSTOM_DB_UPDATE_PROGRESS", [dbObj, -1, 0]);
        store.commit("CUSTOM_DB_UPDATE_ERROR", [dbObj, false, "", undefined]);
        store.commit("CUSTOM_DB_RESET_LOG", dbObj);
        store.commit("CUSTOM_DB_UPDATE_READY_STATUS", [dbObj, false]);
        store.commit(
            "CUSTOM_DB_UPDATE_CANCELLATION_STATUS",
            [dbObj, false]
        );

        await this.updateMetadata(dbObj);
    }

    private async stopDatabase(
        store: ActionContext<CustomDatabaseState, any>,
        dbName: string
    ): Promise<void> {
        const dbObj = store.getters.database(dbName);

        const dockerCommunicator = new DockerCommunicator(this.configuration.customDbStorageLocation);
        await dockerCommunicator.stopDatabaseBuild(dbObj);

        store.commit("CUSTOM_DB_UPDATE_CANCELLATION_STATUS", [dbObj, true]);
        store.commit("CUSTOM_DB_UPDATE_READY_STATUS", [dbObj, true]);

        dbObj.inProgress = false;

        await this.updateMetadata(dbObj);
    }

    private async buildDatabase(
        store: ActionContext<CustomDatabaseState, any>,
        [
            dbName,
            databaseTypes,
            databaseSources,
            taxa,
            uniprotVersion
        ]: [
            string,
            string[],
            string[],
            NcbiId[],
            string
        ]
    ): Promise<void> {
        store.commit("CUSTOM_DB_ADD_DATABASE", [
            dbName,
            databaseTypes,
            databaseSources,
            taxa,
            uniprotVersion
        ]);

        const dbObj = store.getters.database(dbName);
        await this.updateMetadata(dbObj);
    }

    private updateMetadata(dbObj: CustomDatabase): Promise<void> {
        return this.customDbManager.updateMetadata(this.configuration.customDbStorageLocation, dbObj);
    }
}
