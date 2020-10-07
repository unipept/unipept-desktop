import Vue from "vue";
import Vuetify from "vuetify/lib";
import { Ripple } from "vuetify/lib/directives"
// @ts-ignore
import IconTestMultiple from "@/assets/icons/test_multiple.svg";

Vue.use(Vuetify, {
    directives: {
        Ripple
    }
});

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
