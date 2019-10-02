const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  chainWebpack: config => config.resolve.symlinks(false),
  // configureWebpack: {
  //   plugins: [
  //     new CopyWebpackPlugin([{
  //       from: 'node_modules/unipept-web-components/', to: '/public/dist'
  //     }])
  //   ]
  // }
}
