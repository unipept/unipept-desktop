import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                "@common": resolve("src/common")
            }
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                "@common": resolve("src/common"),
                "@preload": resolve("src/preload")
            }
        },
    },
    renderer: {
        resolve: {
            alias: {
                "@renderer": resolve("src/renderer"),
                "@common": resolve("src/common")
            }
        },
        plugins: [vue()],
        optimizeDeps: {
            exclude: ["marked"]
        }
    }
});
