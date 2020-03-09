import { GetterTree, MutationTree, ActionTree, ActionContext, Store } from "vuex";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";

/**
 * The AssayState keeps track of which assays are currently selected by the user for analysis, and which assays are
 * present in the browser's local storage. This store guarantees that the initial objects set in this state will only
 * be modified and will not be replaced by different objects (which might break Vue reactivity).
 */
export interface ComparativeState {
    // Which assays are currently selected
    selectedAssays: Assay[]
}

const comparativeState: ComparativeState = {
    selectedAssays: []
}

const comparativeGetters: GetterTree<ComparativeState, any> = {
    getSelectedAssays(state: ComparativeState): Assay[] {
        return state.selectedAssays;
    }
}


const comparativeMutations: MutationTree<ComparativeState> = {
    ADD_SELECTED_ASSAY(state: ComparativeState, assay: Assay) {
        const id: number = state.selectedAssays.findIndex(a => a.getId() === assay.getId());

        if (id === -1) {
            state.selectedAssays.push(assay);
        }
    },
    REMOVE_SELECTED_ASSAY(state: ComparativeState, assay: Assay) {
        const id: number = state.selectedAssays.findIndex(a => a.getId() === assay.getId());

        if (id >= 0) {
            state.selectedAssays.splice(id, 1);
        }
    }
}

const comparativeActions: ActionTree<ComparativeState, any> = {
    addSelectedAssay(store: ActionContext<ComparativeState, any>, assay: Assay) {
        store.commit("ADD_SELECTED_ASSAY", assay);
    },

    removeSelectedAssay(store: ActionContext<ComparativeState, any>, assay: Assay) {
        store.commit("REMOVE_SELECTED_ASSAY", assay);
    }
}

export const ComparativeStore = {
    state: comparativeState,
    mutations: comparativeMutations,
    getters: comparativeGetters,
    actions: comparativeActions
}
