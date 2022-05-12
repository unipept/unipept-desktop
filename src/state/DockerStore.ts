import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { NcbiId, ProgressReport, ProgressReportHelper } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import Vue from "vue";
import { queue } from "async";
import Configuration from "@/logic/configuration/Configuration";
import * as path from "path";
import CustomDatabaseManager from "@/logic/filesystem/docker/CustomDatabaseManager";

type CustomDatabaseInfo = {
    database: CustomDatabase,
    progress: ProgressReport,
    // Whether the database has been constructed successfully.
    ready: boolean,
    // Was the construction of this custom database cancelled?
    cancelled: boolean,
    error: {
        status: boolean,
        message: string,
        object: Error
    }
};

export { CustomDatabaseInfo };

const progressSteps: string[] = [
    "Creating taxon tables",
    "Initializing database build process",
    "Downloading database",
    "Processing chunks",
    "Started building main database tables",
    "Calculating lowest common ancestors",
    "Calculating functional annotations",
    "Sorting peptides",
    "Creating sequence table",
    "Fetching EC numbers",
    "Fetching GO terms",
    "Fetching InterPro entries",
    "Filling database and computing indices"
];

export interface CustomDatabaseState {
    databases: CustomDatabaseInfo[],
    // Is the construction process for at least one database currently in progress?
    constructionInProgress: boolean
}

const databaseState: CustomDatabaseState = {
    databases: [],
    constructionInProgress: false
}

const databaseGetters: GetterTree<CustomDatabaseState, any> = {
    databases(state: CustomDatabaseState): CustomDatabaseInfo[] {
        return state.databases;
    },

    databaseInfo(state: CustomDatabaseState): (db: CustomDatabase) => CustomDatabaseInfo | undefined {
        return (db: CustomDatabase) => state.databases.find(d => d.database.name === db.name);
    },

    constructionInProgress(state: CustomDatabaseState): boolean {
        return state.constructionInProgress;
    }
}

const databaseMutations: MutationTree<CustomDatabaseState> = {
    ADD_DATABASE(
        state: CustomDatabaseState,
        database: CustomDatabase
    ) {
        state.databases.push({
            database: database,
            progress: ProgressReportHelper.constructProgressReportObject(progressSteps),
            cancelled: false,
            ready: false,
            error: {
                status: false,
                message: "",
                object: undefined
            }
        });
    },

    UPDATE_DATABASE_PROGRESS(
        state: CustomDatabaseState,
        [database, value, progress_step]: [CustomDatabase, number, number]
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
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

    ADD_DATABASE_LOG(
        state: CustomDatabaseState,
        [database, logLine]: [CustomDatabase, string]
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
        dbObj.progress.logs.push(logLine);
    },

    RESET_DATABASE_LOG(
        state: CustomDatabaseState,
        database: CustomDatabase
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
        dbObj.progress.logs.splice(0, dbObj.progress.logs.length);
    },

    UPDATE_DATABASE_STATUS(
        state: CustomDatabaseState,
        [database, status]: [CustomDatabase, boolean]
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
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
        } else {
            // Reset progress values
            for (let i = 0; i < progressObj.steps.length; i++) {
                progressObj.startTimes[i] = 0;
                progressObj.endTimes[i] = 0;
            }
        }

        dbObj.ready = status;
    },

    UPDATE_DATABASE_ERROR(
        state: CustomDatabaseState,
        [database, errorStatus, errorMsg, errorObj]: [CustomDatabase, boolean, string, Error]
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
        dbObj.error.status = errorStatus;
        dbObj.error.message = errorMsg;
        dbObj.error.object = errorObj;
    },

    UPDATE_CONSTRUCTION_STATUS(
        state: CustomDatabaseState,
        inProgress: boolean
    ) {
        state.constructionInProgress = inProgress;
    },

    UPDATE_DATABASE_CANCELLATION_STATUS(
        state: CustomDatabaseState,
        [database, cancellationStatus]: [CustomDatabase, boolean]
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
        dbObj.cancelled = cancellationStatus;
    },

    ADD_TO_DB_LIST(
        state: CustomDatabaseState,
        list: CustomDatabase[]
    ) {
        for (const db of list) {
            state.databases.push({
                database: db,
                progress: ProgressReportHelper.constructProgressReportObject(progressSteps),
                cancelled: false,
                ready: true,
                error: {
                    status: false,
                    message: "",
                    object: undefined
                }
            });
        }
    }
}

const databaseActions: ActionTree<CustomDatabaseState, any> = {
    buildDatabase: {
        root: false,
        async handler(
            store: ActionContext<CustomDatabaseState, any>,
            [
                dbName,
                databaseSources,
                databaseTypes,
                taxa,
                configuration
            ]: [
                string,
                string[],
                string[],
                NcbiId[],
                Configuration
            ]
        ) {
            // TODO change to correct most recent version, retrieved from the Expasy FTP server.
            const dbVersion = "2021.3";

            // TODO count exact number of entries that will be present in this database.
            const customDb = new CustomDatabase(
                dbName,
                databaseSources,
                databaseTypes,
                taxa,
                0,
                dbVersion
            );

            store.commit("ADD_DATABASE", customDb);

            const customDbMng = new CustomDatabaseManager();
            await customDbMng.updateMetadata(configuration.customDbStorageLocation, customDb);
        }
    },

    stopDatabase: {
        root: false,
        async handler(
            store: ActionContext<CustomDatabaseState, any>,
            dbName: string
        ) {
            const dbObj = store.state.databases.find(db => db.database.name === dbName);

            this.commit(
                "UPDATE_DATABASE_CANCELLATION_STATUS",
                [dbObj.database, true]
            );
            this.commit("UPDATE_DATABASE_STATUS", [dbObj.database, true]);

            const dockerCommunicator = new DockerCommunicator();
            await dockerCommunicator.stopDatabase();
        }
    },

    reanalyzeDb(
        store: ActionContext<CustomDatabaseState, any>,
        dbName: string
    ) {
        const dbObj = store.state.databases.find(db => db.database.name === dbName);
        store.commit("UPDATE_DATABASE_ERROR", [dbObj.database, false, "", undefined]);
        store.commit("RESET_DATABASE_LOG", dbObj.database);
        store.commit("UPDATE_DATABASE_STATUS", [dbObj.database, false]);
        store.commit(
            "UPDATE_DATABASE_CANCELLATION_STATUS",
            [dbObj.database, false]
        );
    },

    initializeQueue(
        store: ActionContext<CustomDatabaseState, any>,
        [queue, configuration]: [CustomDatabase[], Configuration]
    ) {
        for (const db of queue) {
            store.commit("ADD_DATABASE", db);
        }

        const dockerCommunicator = new DockerCommunicator();

        setInterval(
            async() => {
                if (!store.getters.constructionInProgress && !(await dockerCommunicator.isDatabaseActive())) {
                    // If no databases are currently being constructed, and at least one database is waiting in the
                    // queue, we should start the construction process for this database.
                    const scheduledDatabases = store.getters.databases.filter(
                        (db: CustomDatabaseInfo) => !db.ready && !db.error.status
                    );
                    if (scheduledDatabases.length > 0) {
                        await startDatabaseConstruction(store, scheduledDatabases[0].database, configuration);
                    }
                }
            },
            1000
        );
    },

    initializeReadyDatabases(
        store: ActionContext<CustomDatabaseState, any>,
        dbList: CustomDatabase[]
    ) {
        store.commit("ADD_TO_DB_LIST", dbList);
    }
}

const startDatabaseConstruction = async function(
    store: ActionContext<CustomDatabaseState, any>,
    customDb: CustomDatabase,
    configuration: Configuration
) {
    store.commit("UPDATE_CONSTRUCTION_STATUS", true);

    const dockerCommunicator = new DockerCommunicator();
    try {
        await dockerCommunicator.buildDatabase(
            customDb,
            path.join(configuration.customDbStorageLocation, "databases", customDb.name, "data"),
            path.join(configuration.customDbStorageLocation, "index"),
            (step, value, progress_step) => {
                store.commit("UPDATE_DATABASE_PROGRESS", [customDb, value, progress_step]);
            },
            (line: string) => {
                store.commit("ADD_DATABASE_LOG", [customDb, line])
            }
        );

        const customManager = new CustomDatabaseManager();
        await customManager.updateMetadata(configuration.customDbStorageLocation, customDb);

        store.commit("UPDATE_DATABASE_STATUS", [customDb, true]);
    } catch (err) {
        store.commit("UPDATE_DATABASE_ERROR", [customDb, true, err.message, err]);
    } finally {
        store.commit("UPDATE_CONSTRUCTION_STATUS", false);
    }
}

export const customDatabaseStore = {
    state: databaseState,
    getters: databaseGetters,
    mutations: databaseMutations,
    actions: databaseActions
}
