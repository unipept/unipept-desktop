import { Database } from "better-sqlite3";
import { Study } from "unipept-web-components";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import FileSystemWatcher from "@/logic/filesystem/project/FileSystemWatcher";
import path from "path";

export interface ProjectState {
    projectName: string,
    projectLocation: string,
    database: Database,
    studies: Study[],
    fileSystemWatcher: FileSystemWatcher
}

const projectState: ProjectState = {
    projectName: "",
    projectLocation: "",
    database: undefined,
    studies: [],
    fileSystemWatcher: undefined
}

const projectGetters: GetterTree<ProjectState, any> = {
    studies(state: ProjectState): Study[] {
        return state.studies;
    },

    projectName(state: ProjectState): string {
        return state.projectName;
    },

    projectLocation(state: ProjectState): string {
        return state.projectLocation;
    },

    database(state: ProjectState): Database {
        return state.database;
    },

    databaseFile(state: ProjectState): string {
        return state.projectLocation + "metadata.sqlite";
    }
};

const projectMutations: MutationTree<ProjectState> = {
    SET_FILE_SYSTEM_WATCHER(state: ProjectState, watcher: FileSystemWatcher) {
        // Make sure to close the previous watcher!
        if (state.fileSystemWatcher) {
            state.fileSystemWatcher.closeWatcher();
        }
        state.fileSystemWatcher = watcher;
    },

    ADD_STUDY(state: ProjectState, study: Study) {
        const existingStudy = state.studies.find(s => s.getName() === study.getName());
        if (!existingStudy) {
            state.studies.push(study);
        }
    },

    REMOVE_STUDY(state: ProjectState, study: Study) {
        const idx = state.studies.findIndex(s => s.getName() === study.getName());
        if (idx >= 0) {
            state.studies.splice(idx, 1);
        }
    },

    SET_STUDIES(state: ProjectState, studies: Study[]) {
        state.studies.splice(0, state.studies.length);
        state.studies.push(...studies);
    },

    SET_PROJECT(state: ProjectState, [name, location, database]: [string, string, Database]) {
        state.projectName = name;
        state.projectLocation = location;
        state.database = database;
    }
};

const projectActions: ActionTree<ProjectState, any> = {
    async initializeProject(
        store: ActionContext<ProjectState, any>,
        [
            projectDirectory,
            database,
            studies
        ]: [
            string,
            Database,
            Study[]
        ]
    ) {
        // Make sure that all assays from the previously loaded project are gone.
        for (const assayData of store.rootGetters.assays) {
            store.dispatch("removeAssay", assayData.assay);
        }

        if (!projectDirectory.endsWith("/")) {
            projectDirectory += "/";
        }

        const name = path.basename(projectDirectory);


        store.commit("SET_PROJECT", [name, projectDirectory, database]);

        for (const study of studies) {
            for (const assay of study.getAssays()) {
                await store.dispatch("addAssay", assay);
                store.dispatch("processAssay", assay);
            }
        }

        store.commit("SET_STUDIES", studies);

        const fileWatcher = new FileSystemWatcher();
        store.commit("SET_FILE_SYSTEM_WATCHER", fileWatcher);
    },

    addStudy(store: ActionContext<ProjectState, any>, study: Study) {
        store.commit("ADD_STUDY", study);
    },

    removeStudy(store: ActionContext<ProjectState, any>, study: Study) {
        store.commit("REMOVE_STUDY", study);
    }
}

export const projectStore = {
    state: projectState,
    getters: projectGetters,
    mutations: projectMutations,
    actions: projectActions
};
