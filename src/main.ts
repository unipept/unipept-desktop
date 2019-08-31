import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import {install} from 'unipept-web-components';
import * as heatmap from 'unipept-heatmap';
import * as unipept from 'unipept-web-components';

console.log(heatmap);
console.log(unipept);

Vue.use(install);

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')


