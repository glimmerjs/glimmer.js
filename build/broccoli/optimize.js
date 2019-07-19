'use strict';

const babel = require('broccoli-babel-transpiler');

/**
 * Optimizes out Glimmer utility functions and strips debug code with a set of
 * Babel plugins.
 */
module.exports = function(jsTree) {
  let isProduction = process.env.EMBER_ENV === 'production';

  let plugins = [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    [require.resolve('babel-plugin-debug-macros'), {
      debugTools: {
        isDebug: !isProduction,
        source: '@glimmer/debug'
      },

      flags: [
        {
          source: '@glimmer/env',
          flags: {
            DEBUG: !isProduction,
            CI: !!process.env.CI
          }
        }
      ],

      externalizeHelpers: {
        module: true
      }
    }]
  ];

  if (isProduction) {
    plugins = [
      ...plugins,
      [require.resolve('babel-plugin-strip-glimmer-utils'), {
        bindings: ['expect', 'unwrap'],
        source: '@glimmer/util'
      }]
    ];
  }

  return babel(jsTree, {
    annotation: 'Babel - Strip Glimmer Utilities',
    sourceMaps: 'inline',
    plugins
  });
}