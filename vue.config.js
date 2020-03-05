module.exports = {
    chainWebpack: config => {
        config.resolve.symlinks(false);
        config.externals([
            {
                // Fix for node native addon inclusion failures
                "fsevents": "require('fsevents')",
                "better-sqlite3": "require('better-sqlite3')"
            }
        ])
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                "appId": "be.ugent.unipept.desktop",
                "mac": {
                    "hardenedRuntime": true,
                    "gatekeeperAssess": false,
                    "entitlements": "build/entitlements.mac.plist",
                    "entitlementsInherit": "build/entitlements.mac.plist"
                },
                "afterSign": "scripts/notarize.js"
            },
        }
    }
}
