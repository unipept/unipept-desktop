import '@mdi/font/css/materialdesignicons.css';
import "@renderer/assets/styles/main.scss";
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { createVuetify } from "vuetify";
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import iconTestMultiple from "@renderer/components/icons/IconTestMultiple.vue";

const unipeptLightTheme = {
    dark: false,
    colors: {
        primary: '#1976d2',
        'primary-darken-1': '#1565C0',
        secondary: '#FFC107',
        'secondary-darken-1': '#FFB300',
        error: '#B00020',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FB8C00',
    },
};

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'unipeptLightTheme',
        themes: {
            unipeptLightTheme
        }
    },
    icons: {
        defaultSet: 'mdi',
        aliases: {
            ...aliases,
            "test-multiple": iconTestMultiple
        },
        sets: {
            mdi,
        },
    },
    defaults: {
        VTooltip: {
            openDelay: 500,
            location: "bottom"
        }
    }
});

export default vuetify;
