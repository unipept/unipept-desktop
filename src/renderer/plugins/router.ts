import { createRouter, createWebHistory } from 'vue-router';
import SettingsPage from '@renderer/components/pages/SettingsPage.vue';

const routes = [
    {
        path: "/",
        component: () => import("../components/pages/HomePage.vue"),
    },
    {
        path: "/settings",
        component: SettingsPage
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;

