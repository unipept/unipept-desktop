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
    configureWebpack:{
        target: "electron-renderer",
        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1
            })
        ]
    },
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            builderOptions: {
                "appId": "be.ugent.unipept.desktop",
                "artifactName": "Unipept-Desktop-${arch}.${ext}",
                "asar": true,
                "mac": {
                    "hardenedRuntime": true,
                    "gatekeeperAssess": false,
                    "entitlements": "build/entitlements.mac.plist",
                    "entitlementsInherit": "build/entitlements.mac.plist",
                    "target": [
                        {
                            "target": "default",
                            "arch": [
                                "x64",
                                "arm64"
                            ]
                        }
                    ]
                },
                "afterSign": "scripts/notarize.js",
                "dmg": {
                    "sign": false
                },
                "linux": {
                    "target": "AppImage"
                }
            },
        },
    }
}
