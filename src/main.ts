import Vue from "vue"
import App from "./App.vue"
import vuetify from "./plugins/vuetify";

import { ConfigurationStore, AssayStoreFactory, SinglePeptideStoreFactory } from "unipept-web-components";

import Vuex, { ActionContext } from "vuex";
import VueRouter from "vue-router";
import vueFullscreen from "vue-fullscreen";

import { DesktopConfigurationStore } from "@/state/DesktopConfigurationStore";
import { projectStore } from "@/state/ProjectStore";
import { customDatabaseStore } from "@/state/DockerStore";
import { ComparativeStore } from "@/state/ComparativeStore";

import HomePage from "@/components/pages/HomePage.vue";
import AnalysisPage from "@/components/pages/analysis/AnalysisPage.vue";
import SettingsPage from "@/components/pages/SettingsPage.vue";
import ComparativeAnalysisPage from "@/components/pages/analysis/ComparativeAnalysisPage.vue";

import PeptideAnalysisPage from "@/components/pages/PeptideAnalysisPage.vue";
import SingleAssayAnalysisPage from "@/components/pages/analysis/SingleAssayAnalysisPage.vue";
import CustomDatabasePage from "@/components/pages/CustomDatabasePage.vue";

const { app } = require("electron").remote;
const bt = require("backtrace-js");

// JavaScript errors in renderer process
bt.initialize({
    endpoint: "https://unipept.sp.backtrace.io:6098",
    token: "94d2b87fb00b2b755d07dc4bad99f231603503724471e122f95212f768704898",
    handlePromises: true,
    attributes: {
        application: "Unipept Desktop",
        version: app.getVersion()
    }
});

Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(vueFullscreen);


const assayStoreFactory = new AssayStoreFactory();
const singlePeptideStoreFactory = new SinglePeptideStoreFactory();

export const store = new Vuex.Store({
    modules: {
        assay: assayStoreFactory.constructAssayStore(),
        singlePeptide: singlePeptideStoreFactory.constructSinglePeptideStoreFactory("https://api.unipept.ugent.be"),
        configuration: ConfigurationStore,
        desktopConfiguration: DesktopConfigurationStore,
        comparative: ComparativeStore,
        project: projectStore,
        customDatabase: customDatabaseStore
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
        path: "/analysis",
        component: AnalysisPage,
        children: [
            {
                path: "single",
                component: SingleAssayAnalysisPage,
                meta: {
                    title: "Single assay analysis"
                }
            },
            {
                path: "multi",
                component: ComparativeAnalysisPage,
                meta: {
                    title: "Comparative analysis"
                }
            }
        ]
    },
    {
        path: "/peptide/single",
        component: PeptideAnalysisPage,
        meta: {
            title: "Tryptic peptide analysis"
        }
    },
    {
        path: "/databases",
        component: CustomDatabasePage,
        meta: {
            title: "Custom databases"
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

