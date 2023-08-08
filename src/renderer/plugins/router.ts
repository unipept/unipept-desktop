import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: "/",
        component: () => import("../components/pages/HomePage.vue"),
    },
    {
        path: "/settings",
        component: () => import("../components/pages/SettingsPage.vue"),
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router;

