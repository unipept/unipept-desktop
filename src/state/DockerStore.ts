import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { NcbiId } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import Vue from "vue";
import { queue } from "async";
import Configuration from "@/logic/configuration/Configuration";
import * as path from "path";
import CustomDatabaseManager from "@/logic/filesystem/docker/CustomDatabaseManager";

const PROGRESS_STEPS_LENGTH: number = 12;

type CustomDatabaseInfo = {
    database: CustomDatabase
    progress: {
        // Progress value ([0 - 100]) or -1 if indeterminate
        value: number,
        step: string,
        progress_step: number,
        startTimes: number[],
        endTimes: number[],
        previousStep: number
    },
    // Whether the database has been constructed successfully.
    ready: boolean
};

export { CustomDatabaseInfo };

export interface CustomDatabaseState {
    databases: CustomDatabaseInfo[],
    // A list of all custom database objects that are queued for construction. Once the previous database has been
    // built, the next one can be retrieved from this list and should start it's construction. This list is populated
    // when the application starts.
    queue: CustomDatabase[],
    // Is the construction process for at least one database currently in progress?
    constructionInProgress: boolean
}

const databaseState: CustomDatabaseState = {
    databases: [],
    queue: [],
    constructionInProgress: false
}


const databaseGetters: GetterTree<CustomDatabaseState, any> = {
    databases(state: CustomDatabaseState): CustomDatabaseInfo[] {
        return state.databases;
    },

    databaseInfo(state: CustomDatabaseState): (db: CustomDatabase) => CustomDatabaseInfo | undefined {
        return (db: CustomDatabase) => state.databases.find(d => d.database.name === db.name);
    },

    queue(state: CustomDatabaseState): CustomDatabase[] {
        return state.queue;
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
            progress: {
                value: -1,
                step: "Initializing database construction",
                progress_step: 0,
                startTimes: new Array(PROGRESS_STEPS_LENGTH).fill(-1),
                endTimes: new Array(PROGRESS_STEPS_LENGTH).fill(-1),
                previousStep: -1
            },
            ready: false
        });
    },

    UPDATE_DATABASE_PROGRESS(
        state: CustomDatabaseState,
        [database, step, value, progress_step]: [CustomDatabase, string, number, number]
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
        dbObj.progress.value = value;
        dbObj.progress.step = step;
        dbObj.progress.progress_step = progress_step;

        if (dbObj.progress.previousStep !== progress_step) {
            const time = new Date().getTime();
            dbObj.progress.startTimes[progress_step] = time;
            dbObj.progress.endTimes[dbObj.progress.previousStep] = time;
        }

        console.log(JSON.stringify(dbObj.progress));

        dbObj.progress.previousStep = progress_step;
    },

    UPDATE_DATABASE_STATUS(
        state: CustomDatabaseState,
        [database, status]: [CustomDatabase, boolean]
    ) {
        state.databases.find(db => db.database.name === database.name).ready = status;
    },

    INITIALIZE_QUEUE(
        state: CustomDatabaseState,
        queueContents: CustomDatabase[]
    ) {
        state.queue.splice(0, state.queue.length);
        state.queue.push(...queueContents);
    },

    ADD_TO_QUEUE(
        state: CustomDatabaseState,
        db: CustomDatabase
    ) {
        state.queue.push(db);
    },

    REMOVE_FROM_QUEUE(
        state: CustomDatabaseState,
        db: CustomDatabase
    ) {
        const idx = state.queue.findIndex(c => c.name === db.name);
        state.queue.splice(idx, 1);
    },

    UPDATE_CONSTRUCTION_STATUS(
        state: CustomDatabaseState,
        inProgress: boolean
    ) {
        state.constructionInProgress = inProgress;
    },

    ADD_TO_DB_LIST(
        state: CustomDatabaseState,
        list: CustomDatabase[]
    ) {
        for (const db of list) {
            state.databases.push({
                database: db,
                progress: {
                    value: 1,
                    step: "",
                    progress_step: 0,
                    startTimes: new Array(PROGRESS_STEPS_LENGTH).fill(-1),
                    endTimes: new Array(PROGRESS_STEPS_LENGTH).fill(-1),
                    previousStep: -1
                },
                ready: true
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
            customDbMng.updateMetadata(configuration.customDbStorageLocation, customDb);

            if (!store.getters.constructionInProgress) {
                await startDatabaseConstruction(store, customDb, configuration);
            }
        }
    },

    initializeQueue(
        store: ActionContext<CustomDatabaseState, any>,
        [queue, configuration]: [CustomDatabase[], Configuration]
    ) {
        for (const db of queue) {
            store.commit("ADD_DATABASE", db);
        }
        store.commit("INITIALIZE_QUEUE", queue);

        setInterval(
            async() => {
                if (!store.getters.constructionInProgress) {
                    // If no databases are currently being constructed, and at least one database is waiting in the
                    // queue, we should start the construction process for this database.
                    if (store.getters.queue.length > 0) {
                        await startDatabaseConstruction(store, store.getters.queue[0], configuration);
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
    await dockerCommunicator.buildDatabase(
        customDb,
        path.join(configuration.customDbStorageLocation, "databases", customDb.name),
        path.join(configuration.customDbStorageLocation, "index"),
        (step, value, progress_step) => {
            store.commit("UPDATE_DATABASE_PROGRESS", [customDb, step, value, progress_step]);
        }
    );

    const customManager = new CustomDatabaseManager();
    customManager.updateMetadata(configuration.customDbStorageLocation, customDb);

    store.commit("UPDATE_DATABASE_STATUS", [customDb, true]);
}

export const customDatabaseStore = {
    state: databaseState,
    getters: databaseGetters,
    mutations: databaseMutations,
    actions: databaseActions
}
