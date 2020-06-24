module.exports = {
  presets: [
    '@vue/app'
  ],
  // These can be removed once we are using Webpack 5
  // See: https://github.com/webpack/webpack/issues/10227
  plugins: [
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator'
  ]
}
