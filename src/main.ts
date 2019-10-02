import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import {GlobalStore} from 'unipept-web-components/src/state/GlobalStore';
import {AnalysisStore} from 'unipept-web-components/src/state/AnalysisStore';
import Vuex from 'vuex';
import vueFullscreen from 'vue-fullscreen';
import VueRouter from 'vue-router';
import HomePage from './components/pages/HomePage.vue';
import AnalysisPage from './components/pages/AnalysisPage.vue';
import "unipept-visualizations/dist/unipept-visualizations.es5.js";

Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(vueFullscreen);

const store = new Vuex.Store({
  modules: {
      global: GlobalStore,
      analysis: AnalysisStore
  }
});

const routes = [
  { path: '/', component: HomePage },
  { path: '/analysis', component: AnalysisPage }
]

const router = new VueRouter({
  routes
})

Vue.config.productionTip = false

new Vue({
  // @ts-ignore
  store: store,
  vuetify: vuetify,
  router: router,
  render: h => h(App)
}).$mount('#app')


