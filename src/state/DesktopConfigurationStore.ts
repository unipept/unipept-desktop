import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";

export interface ConfigurationState {
    useNativeTitlebar: boolean
}

const configState: ConfigurationState = {
    useNativeTitlebar: false
}

const configGetters: GetterTree<ConfigurationState, any> = {
    useNativeTitlebar(state: ConfigurationState): boolean {
        return state.useNativeTitlebar;
    }
}

const configMutations: MutationTree<ConfigurationState> = {
    SET_USE_NATIVE_TITLEBAR(state: ConfigurationState, use: boolean): void {
        state.useNativeTitlebar = use;
    }
}

const configActions: ActionTree<ConfigurationState, any> = {
    setUseNativeTitlebar(store: ActionContext<ConfigurationState, any>, use: boolean): void {
        store.commit("SET_USE_NATIVE_TITLEBAR", use);
    }
}

export const DesktopConfigurationStore = {
    state: configState,
    mutations: configMutations,
    getters: configGetters,
    actions: configActions
}
