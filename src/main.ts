import Vue from "vue"
import App from "./App.vue"
import vuetify from "./plugins/vuetify";
import { createAssayStore } from "unipept-web-components/src/state/AssayStore";
import { lcaOntologyStore } from "unipept-web-components/src/state/LcaOntologyStore";
import { FilterStore } from "unipept-web-components/src/state/FilterStore";
import { ConfigurationStore } from "unipept-web-components/src/state/ConfigurationStore";
import { DesktopConfigurationStore } from "./state/DesktopConfigurationStore";
import { projectStore } from "./state/ProjectStore";
import Vuex from "vuex";
import vueFullscreen from "vue-fullscreen";
import VueRouter from "vue-router";
import HomePage from "./components/pages/HomePage.vue";
import AnalysisPage from "./components/pages/AnalysisPage.vue";
import SettingsPage from "./components/pages/SettingsPage.vue";
import "unipept-visualizations/dist/unipept-visualizations.es5.js";
import ComparativeAnalysisPage from "@/components/pages/ComparativeAnalysisPage.vue";
import { ComparativeStore } from "@/state/ComparativeStore";
import FunctionalOntologyStoreFactory from "unipept-web-components/src/state/FunctionalOntologyStoreFactory";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import EcCountTableProcessor from "unipept-web-components/src/business/processors/functional/ec/EcCountTableProcessor";
import GoCountTableProcessor from "unipept-web-components/src/business/processors/functional/go/GoCountTableProcessor";
import InterproCountTableProcessor from "unipept-web-components/src/business/processors/functional/interpro/InterproCountTableProcessor";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import EcOntologyProcessor from "unipept-web-components/src/business/ontology/functional/ec/EcOntologyProcessor";
import GoOntologyProcessor from "unipept-web-components/src/business/ontology/functional/go/GoOntologyProcessor";
import InterproOntologyProcessor from "unipept-web-components/src/business/ontology/functional/interpro/InterproOntologyProcessor";

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
    communicationSource => new EcOntologyProcessor(communicationSource)
);
const goStore = functionalStoreFactory.createOntologyStore(
    (
        x: CountTable<Peptide>,
        configuration: SearchConfiguration,
        communicationSource: CommunicationSource
    ) => new GoCountTableProcessor(x, configuration, communicationSource),
    communicationSource => new GoOntologyProcessor(communicationSource)
);
const iprStore = functionalStoreFactory.createOntologyStore(
    (
        x: CountTable<Peptide>,
        configuration: SearchConfiguration,
        communicationSource: CommunicationSource
    ) => new InterproCountTableProcessor(x, configuration, communicationSource),
    communicationSource => new InterproOntologyProcessor(communicationSource)
);

const assayStore = createAssayStore(async(p2dCommunicator, assay: ProteomicsAssay, countTable: CountTable<Peptide>) => {
    const searchConfig = assay.getSearchConfiguration();
    return new CachedCommunicationSource(
        p2dCommunicator.getPeptideResponseMap(searchConfig),
        await p2dCommunicator.getPeptideTrust(countTable, searchConfig),
        searchConfig
    );
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
        project: projectStore
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

