import Vue from "vue"
import App from "./App.vue"
import vuetify from "./plugins/vuetify";

import {
    createAssayStore,
    AssayState,
    lcaOntologyStore,
    FilterStore,
    ConfigurationStore,
    CountTable,
    Peptide,
    EcCountTableProcessor,
    GoCountTableProcessor,
    InterproCountTableProcessor,
    SearchConfiguration,
    CommunicationSource,
    ProteomicsAssay,
    EcOntologyProcessor,
    GoOntologyProcessor,
    InterproOntologyProcessor,
    ProgressListener,
    FunctionalOntologyStoreFactory
} from "unipept-web-components";

import Vuex, { ActionContext } from "vuex";
import VueRouter from "vue-router";
import vueFullscreen from "vue-fullscreen";

import { DesktopConfigurationStore } from "@/state/DesktopConfigurationStore";
import { projectStore } from "@/state/ProjectStore";
import { summaryStore } from "@/state/PeptideSummaryStore";
import { ComparativeStore } from "@/state/ComparativeStore";

import HomePage from "@/components/pages/HomePage.vue";
import AnalysisPage from "@/components/pages/AnalysisPage.vue";
import SettingsPage from "@/components/pages/SettingsPage.vue";
import ComparativeAnalysisPage from "@/components/pages/ComparativeAnalysisPage.vue";
import DesktopAssayProcessor from "@/logic/communication/DesktopAssayProcessor";

import "unipept-visualizations/dist/unipept-visualizations.es5.js";
import PeptideAnalysisPage from "@/components/pages/PeptideAnalysisPage.vue";

Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(vueFullscreen);

const functionalStoreFactory = new FunctionalOntologyStoreFactory();
const ecStore = functionalStoreFactory.createOntologyStore(
    (
        x: CountTable<Peptide>,
        configuration: SearchConfiguration,
        communicationSource: CommunicationSource
    ) => new EcCountTableProcessor(x, configuration, communicationSource),
    (communicationSource: CommunicationSource) => new EcOntologyProcessor(communicationSource)
);
const goStore = functionalStoreFactory.createOntologyStore(
    (
        x: CountTable<Peptide>,
        configuration: SearchConfiguration,
        communicationSource: CommunicationSource
    ) => new GoCountTableProcessor(x, configuration, communicationSource),
    (communicationSource: CommunicationSource) => new GoOntologyProcessor(communicationSource)
);
const iprStore = functionalStoreFactory.createOntologyStore(
    (
        x: CountTable<Peptide>,
        configuration: SearchConfiguration,
        communicationSource: CommunicationSource
    ) => new InterproCountTableProcessor(x, configuration, communicationSource),
    (communicationSource: CommunicationSource) => new InterproOntologyProcessor(communicationSource)
);

const assayStore = createAssayStore((
    store: ActionContext<AssayState, any>,
    assay: ProteomicsAssay,
    progressListener: ProgressListener
) => {
    return new DesktopAssayProcessor(store.getters.dbManager, assay, progressListener);
});


export const store = new Vuex.Store({
    modules: {
        assay: assayStore,
        filter: FilterStore,
        configuration: ConfigurationStore,
        desktopConfiguration: DesktopConfigurationStore,
        comparative: ComparativeStore,
        ec: ecStore,
        go: goStore,
        interpro: iprStore,
        ncbi: lcaOntologyStore,
        project: projectStore,
        peptideSummary: summaryStore
    }
});

const routes = [
    {
        path: "/",
        component: HomePage,
        meta: {
            title: "Home"
        }
    },
    {
        path: "/analysis/single",
        component: AnalysisPage,
        meta: {
            title: "Single assay analysis"
        }
    },
    {
        path: "/analysis/multi",
        component: ComparativeAnalysisPage,
        meta: {
            title: "Comparative analysis"
        }
    },
    {
        path: "/peptide/single",
        component: PeptideAnalysisPage,
        meta: {
            title: "Tryptic peptide analysis"
        }
    },
    {
        path: "/settings",
        component: SettingsPage,
        meta: {
            title: "Settings"
        }
    }
]

const router = new VueRouter({
    routes,
    mode: "hash"
})

Vue.config.productionTip = false

new Vue({
    // @ts-ignore
    store: store,
    vuetify: vuetify,
    router: router,
    render: h => h(App)
}).$mount("#app")

