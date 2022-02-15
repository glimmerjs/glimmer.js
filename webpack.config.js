const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const commonConfig = {
  mode: 'development',
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
    nodeTests: './test/node.ts',
  },
  module: {
    rules: [
      {
        test: /(\.ts|\.js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@glimmer/babel-preset', '@babel/preset-typescript', '@babel/preset-env'],
          },
        },
      },
    ],
  },
};

const nodeServerConfig = {
  ...commonConfig,
  devtool: false,
  entry: {
    rehydrationNodeServer: './packages/example-apps/rehydration/server.ts',
    partialRehydrationNodeServer: './packages/example-apps/partial-rehydration/server.ts',
  },
  output: {
    ...commonConfig.output,
    libraryTarget: 'umd',
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
            presets: [
              '@glimmer/babel-preset',
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

module.exports = [nodeServerConfig, browserConfig];
