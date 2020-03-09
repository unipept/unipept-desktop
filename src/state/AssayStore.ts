import { GetterTree, MutationTree, ActionTree, ActionContext, Store } from "vuex";
import Entity from "unipept-web-components/src/logic/data-management/assay/Entity";
import Project from "@/logic/filesystem/project/Project";

/**
 * The AssayState keeps track of which assays are currently selected by the user for analysis, and which assays are
 * present in the browser's local storage. This store guarantees that the initial objects set in this state will only
 * be modified and will not be replaced by different objects (which might break Vue reactivity).
 */
export interface AssayState {
    // What project are we currently working with?
    project: Project
}

const assayState: AssayState = {
    project: null
}

const assayGetters: GetterTree<AssayState, any> = {
    getProject(state: AssayState): Project {
        return state.project;
    }
}

const assayMutations: MutationTree<AssayState> = {
    SET_PROJECT(state: AssayState, project: Project) {
        state.project = project;
    }
}

const assayActions: ActionTree<AssayState, any> = {
    setProject(store: ActionContext<AssayState, any>, project: Project) {
        store.commit("SET_PROJECT", project);
    }
}

export const AssayStore = {
    state: assayState,
    mutations: assayMutations,
    getters: assayGetters,
    actions: assayActions
}
