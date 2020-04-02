module.exports = function (api) {
  return {
    plugins: [
      ['@glimmer/babel-plugin-glimmer-env', { DEBUG: !api.env('production') }],
      '@glimmer/babel-plugin-strict-template-precompile',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
    ],
    presets: ['@babel/preset-env', '@babel/preset-typescript'],
  };
};
