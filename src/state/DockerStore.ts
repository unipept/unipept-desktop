import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { NcbiId } from "unipept-web-components";
import DockerCommunicator from "@/logic/communication/docker/DockerCommunicator";
import Vue from "vue";

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
    databases: { [key: string]: CustomDatabaseInfo }
}

const databaseState: CustomDatabaseState = {
    databases: {}
}


const databaseGetters: GetterTree<CustomDatabaseState, any> = {
    databases(state: CustomDatabaseState): { [key: string]: CustomDatabaseInfo } {
        return state.databases;
    },

    databaseInfo(state: CustomDatabaseState): (db: CustomDatabase) => CustomDatabaseInfo | undefined {
        return (db: CustomDatabase) => state.databases[db.name];
    }
}

const databaseMutations: MutationTree<CustomDatabaseState> = {
    ADD_DATABASE(
        state: CustomDatabaseState,
        database: CustomDatabase
    ) {
        Vue.set(state.databases, database.name,  {
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
        state.databases[database.name].progress.value = value;
        state.databases[database.name].progress.step = step;
    },

    UPDATE_DATABASE_STATUS(
        state: CustomDatabaseState,
        [database, status]: [CustomDatabase, boolean]
    ) {
        state.databases[database.name].ready = status;
    }
}

const databaseActions: ActionTree<CustomDatabaseState, any> = {
    buildDatabase(
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
        const customDb = new CustomDatabase(dbName, databaseSources, databaseTypes, taxa, 100);

        store.commit("ADD_DATABASE", customDb)

        const dockerCommunicator = new DockerCommunicator();
        dockerCommunicator.buildDatabase(
            databaseSources,
            databaseTypes,
            taxa,
            databaseFolder,
            indexFolder,
            (step, value) => {
                store.commit("UPDATE_DATABASE_PROGRESS", [customDb, step, value]);
            }
        ).then(() => store.commit("UPDATE_DATABASE_STATUS", [customDb, true]));
    }
}

export const customDatabaseStore = {
    state: databaseState,
    getters: databaseGetters,
    mutations: databaseMutations,
    actions: databaseActions
}
