import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import {install} from 'unipept-web-components';
import {GlobalStore} from 'unipept-web-components';
import {AnalysisStore} from 'unipept-web-components';
import Vuex from 'vuex';
import vueFullscreen from 'vue-fullscreen';

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

Vue.config.productionTip = false

new Vue({
  // @ts-ignore
  store: store,
  vuetify: vuetify,
  render: h => h(App)
}).$mount('#app')


