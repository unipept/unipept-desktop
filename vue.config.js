const ThreadsPlugin = require('threads-plugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');

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
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                "appId": "be.ugent.unipept.desktop"
                // Disable code signing for now.
                // "mac": {
                //     "hardenedRuntime": true,
                //     "gatekeeperAssess": false,
                //     "entitlements": "build/entitlements.mac.plist",
                //     "entitlementsInherit": "build/entitlements.mac.plist"
                // },
                // "afterSign": "scripts/notarize.js",
                // "dmg": {
                //     "sign": false
                // }
            },
        }
    },
    configureWebpack: {
        plugins: [
            new ThreadsPlugin({
                plugins: [new NodeTargetPlugin()]
            })
            // new ThreadsPlugin()
        ]
    }
}
