import Vue from "vue"
import App from "./App.vue"
import vuetify from "./plugins/vuetify";
import { FilterStore } from "unipept-web-components/src/state/FilterStore";
import { ConfigurationStore } from "unipept-web-components/src/state/ConfigurationStore";
import { DesktopConfigurationStore } from "./state/DesktopConfigurationStore";
import Vuex from "vuex";
import vueFullscreen from "vue-fullscreen";
import VueRouter from "vue-router";
import HomePage from "./components/pages/HomePage.vue";
import AnalysisPage from "./components/pages/AnalysisPage.vue";
import SettingsPage from "./components/pages/SettingsPage.vue";
import "unipept-visualizations/dist/unipept-visualizations.es5.js";
import { AssayStore } from "./state/AssayStore";
import ComparativeAnalysisPage from "@/components/pages/ComparativeAnalysisPage.vue";
import { ComparativeStore } from "@/state/ComparativeStore";

Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(vueFullscreen);

const store = new Vuex.Store({
    modules: {
        assay: AssayStore,
        filter: FilterStore,
        configuration: ConfigurationStore,
        desktopConfiguration: DesktopConfigurationStore,
        comparative: ComparativeStore
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


