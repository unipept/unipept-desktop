import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import IconTestMultiple from "@/components/icons/IconTestMultiple.vue";


Vue.use(Vuetify);

export default new Vuetify({
    icons: {
        iconfont: "mdi",
        values: {
            testMultiple: {
                component: IconTestMultiple
            }
        }
    },
    theme: {
        themes: {
            light: {
                secondary: "#ffc107",
                accent: "#2196F3"
            }
        }
    }
});
