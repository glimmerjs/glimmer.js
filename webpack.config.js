const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const commonBabelPlugins = [
  ['@glimmer/babel-plugin-glimmer-env', { DEBUG: true }],
  '@glimmer/babel-plugin-strict-template-precompile',
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  '@babel/plugin-proposal-class-properties',
];

const commonConfig = {
  mode: 'development',
  devtool: false,
  externals: {
    fs: 'fs',
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
    libraryTarget: 'umd',
  },
  devServer: {
    writeToDisk: true,
    before: (app) => {
      app.get('/rehydration', (req, res) => {
        const { default: handler } = require('./dist/rehydrationNodeServer.bundle.js');
        handler(req, res, './rehydration.bundle.js');
      });

      app.get('/partial-rehydration', (req, res) => {
        const { default: handler } = require('./dist/partialRehydrationNodeServer.bundle.js');
        handler(req, res, './partialRehydration.bundle.js');
      });
    },
  },
};

const browserConfig = {
  ...commonConfig,
  entry: {
    app: './packages/example-apps/basic/index.ts',
    rehydration: './packages/example-apps/rehydration/index.ts',
    partialRehydration: './packages/example-apps/partial-rehydration/index.ts',
    tests: './test/index.ts',
  },
  module: {
    rules: [
      {
        test: /(\.ts|\.js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: commonBabelPlugins,
            presets: ['@babel/preset-typescript', '@babel/preset-env'],
          },
        },
      },
    ],
  },
};

const nodeConfig = {
  ...commonConfig,
  entry: {
    rehydrationNodeServer: './packages/example-apps/rehydration/server.ts',
    partialRehydrationNodeServer: './packages/example-apps/partial-rehydration/server.ts',
    nodeTests: './test/node.ts',
  },
  externals: {
    // Remove once we have new glimmer-vm version published. The duplicate version is from linking issues
    '@glimmer/validator': '@glimmer/validator',
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /(\.ts|\.js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: commonBabelPlugins,
            presets: [
              '@babel/preset-typescript',
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: true,
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
};

module.exports = [nodeConfig, browserConfig];
