import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { NcbiId } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import Vue from "vue";
import { queue } from "async";
import Configuration from "@/logic/configuration/Configuration";
import * as path from "path";

type CustomDatabaseInfo = {
    database: CustomDatabase
    progress: {
        // Progress value ([0 - 100]) or -1 if indeterminate
        value: number,
        step: string
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
                step: "Initializing database construction"
            },
            ready: false
        });
    },

    UPDATE_DATABASE_PROGRESS(
        state: CustomDatabaseState,
        [database, step, value]: [CustomDatabase, string, number]
    ) {
        const dbObj = state.databases.find(db => db.database.name === database.name);
        dbObj.progress.value = value;
        dbObj.progress.step = step;
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
                databaseFolder,
                indexFolder
            ]: [
                string,
                string[],
                string[],
                NcbiId[],
                string,
                string
            ]
        ) {
            // TODO count exact number of entries that will be present in this database.
            const customDb = new CustomDatabase(
                dbName,
                databaseSources,
                databaseTypes,
                taxa,
                0
            );

            store.commit("ADD_DATABASE", customDb);

            if (!store.getters.constructionInProgress) {
                store.commit("UPDATE_CONSTRUCTION_STATUS", true);

                const dockerCommunicator = new DockerCommunicator();
                await dockerCommunicator.buildDatabase(
                    customDb,
                    databaseFolder,
                    indexFolder,
                    (step, value) => {
                        store.commit("UPDATE_DATABASE_PROGRESS", [customDb, step, value]);
                    }
                );

                store.commit("UPDATE_DATABASE_STATUS", [customDb, true]);
            }
        }
    },

    initializeQueue(
        store: ActionContext<CustomDatabaseState, any>,
        [queue, configuration]: [CustomDatabase[], Configuration]
    ) {
        store.commit("INITIALIZE_QUEUE", [queue]);

        setTimeout(
            () => {
                if (!store.getters.constructionInProgress) {
                    // If no databases are currently being constructed, and at least one database is waiting in the
                    // queue, we should start the construction process for this database.
                    if (store.getters.queue.length > 0) {
                        store.commit("UPDATE_CONSTRUCTION_STATUS", true);

                        const customDb = store.getters.queue[0];

                        const dockerCommunicator = new DockerCommunicator();
                        dockerCommunicator.buildDatabase(
                            customDb,
                            path.join(configuration.customDbStorageLocation, "databases"),
                            path.join(configuration.customDbStorageLocation, "index"),
                            (step, value) => {
                                store.commit("UPDATE_DATABASE_PROGRESS", [customDb, step, value]);
                            }
                        );
                    }
                }
            },
            1000
        );
    }
}

export const customDatabaseStore = {
    state: databaseState,
    getters: databaseGetters,
    mutations: databaseMutations,
    actions: databaseActions
}
