module.exports = {
    chainWebpack: config => {
        config.resolve.symlinks(false);
        config.externals([
            {
                "fsevents": "require('fsevents')"
            }
        ])
    }
}
