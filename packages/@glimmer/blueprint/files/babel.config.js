module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['@glimmer/babel-preset', '@babel/preset-env', '@babel/preset-typescript'],
  };
};
