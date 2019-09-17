import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import {install} from 'unipept-web-components';
import {GlobalStore} from 'unipept-web-components';
import {AnalysisStore} from 'unipept-web-components';
import Vuex from 'vuex';
import vueFullscreen from 'vue-fullscreen';
import VueRouter from 'vue-router';
import HomePage from './components/pages/HomePage.vue';
import AnalysisPage from './components/pages/AnalysisPage.vue';

Vue.use(VueRouter);

Vue.use(install, {
  "fullscreen": vueFullscreen
});
Vue.use(Vuex);

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


