import { ProteomicsAssay, Study } from "unipept-web-components";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import FileSystemWatcher from "@/logic/filesystem/project/FileSystemWatcher";
import path from "path";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";

export interface ProjectState {
    projectName: string,
    projectLocation: string,
    dbManager: DatabaseManager,
    studies: Study[],
    fileSystemWatcher: FileSystemWatcher
}

const projectState: ProjectState = {
    projectName: "",
    projectLocation: "",
    dbManager: undefined,
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

    dbManager(state: ProjectState): DatabaseManager {
        return state.dbManager;
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

    SET_PROJECT(state: ProjectState, [name, location, dbManager]: [string, string, DatabaseManager]) {
        state.projectName = name;
        state.projectLocation = location;
        state.dbManager = dbManager;
    }
};

const projectActions: ActionTree<ProjectState, any> = {
    async initializeProject(
        store: ActionContext<ProjectState, any>,
        [
            projectDirectory,
            dbManager,
            studies
        ]: [
            string,
            DatabaseManager,
            Study[]
        ]
    ) {
        // Make sure all selections from the previously loaded project are cleared.
        await store.dispatch("resetSelectedAssays");
        await store.dispatch("removeAllAssays");

        if (!projectDirectory.endsWith("/")) {
            projectDirectory += "/";
        }

        const name = path.basename(projectDirectory);


        store.commit("SET_PROJECT", [name, projectDirectory, dbManager]);

        for (const study of studies) {
            for (const assay of study.getAssays()) {
                await store.dispatch("addAssay", assay);
                store.dispatch(
                    "analyseAssay",
                    assay
                );
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
