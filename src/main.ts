import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import {GlobalStore} from 'unipept-web-components/src/state/GlobalStore';
import {AnalysisStore} from 'unipept-web-components/src/state/AnalysisStore';
import {ConfigurationStore} from 'unipept-web-components/src/state/ConfigurationStore';
import {DesktopConfigurationStore} from './state/DesktopConfigurationStore';
import Vuex from 'vuex';
import vueFullscreen from 'vue-fullscreen';
import VueRouter from 'vue-router';
import HomePage from './components/pages/HomePage.vue';
import AnalysisPage from './components/pages/AnalysisPage.vue';
import SettingsPage from './components/pages/SettingsPage.vue';
import "unipept-visualizations/dist/unipept-visualizations.es5.js";

Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(vueFullscreen);

const store = new Vuex.Store({
  modules: {
      global: GlobalStore,
      analysis: AnalysisStore,
      configuration: ConfigurationStore,
      desktopConfiguration: DesktopConfigurationStore
  }
});

const routes = [
  { 
    path: '/', 
    component: AnalysisPage, 
    meta: {
      title: 'Analyse' 
    }
  },
  { 
    path: '/settings', 
    component: SettingsPage, 
    meta: {
      title: 'Settings'
    }
  }
]

const router = new VueRouter({
  routes,
  mode: 'hash'
})

Vue.config.productionTip = false

new Vue({
  // @ts-ignore
  store: store,
  vuetify: vuetify,
  router: router,
  render: h => h(App)
}).$mount('#app')


