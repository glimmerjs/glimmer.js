const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: {
    app: './packages/example-apps/basic/index.ts',
    tests: './test/index.ts',
    nodeTests: './test/node.ts',
  },
  mode: 'development',
  externals: {
    fs: 'fs',
  },
  module: {
    rules: [
      {
        test: /(\.ts|\.js)$/,
        include: [
          path.resolve(__dirname, 'packages/@glimmer'),
          path.resolve(__dirname, 'packages/example-apps'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              '@glimmer/babel-plugin-glimmer-env',
              '@glimmer/babel-plugin-strict-template-precompile',
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              '@babel/plugin-proposal-class-properties',
            ],
            presets: ['@babel/preset-typescript'],
          },
        },
      },
    ],
  },
  resolve: {
    plugins: [
      new TsconfigPathsPlugin({
        mainFields: ['module', 'main'],
      }),
    ],
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    writeToDisk: true,
  },
};
