import Vue from 'vue';
import App from './App.vue';
import * as unipept from 'unipept-web-components';

console.log(unipept);

Vue.use(unipept);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
