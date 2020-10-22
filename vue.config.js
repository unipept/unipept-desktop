const webpack = require("webpack");

module.exports = {
    chainWebpack: config => {
        config.resolve.symlinks(false);
        config.externals([
            {
                // Fix for node native addon inclusion failures
                "fsevents": "require('fsevents')",
                "better-sqlite3": "require('better-sqlite3')"
            }
        ]);
        config.output.globalObject("this");
    },
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            externals: ["better-sqlite3"],
            builderOptions: {
                "appId": "be.ugent.unipept.desktop",
                "asar": true,
                "mac": {
                    "hardenedRuntime": true,
                    "gatekeeperAssess": false,
                    "entitlements": "build/entitlements.mac.plist",
                    "entitlementsInherit": "build/entitlements.mac.plist"
                },
                "afterSign": "scripts/notarize.js",
                "dmg": {
                    "sign": false
                },
                "linux": {
                    "target": "AppImage"
                }
            },
        }
    },
    configureWebpack:{
        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1
            })
        ]
    }
}
