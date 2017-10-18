'use strict';

const babel = require('broccoli-babel-transpiler');
const stripGlimmerUtils = require('babel-plugin-strip-glimmer-utils');
const debugMacros = require('babel-plugin-debug-macros').default;

/**
 * Optimizes out Glimmer utility functions and strips debug code with a set of
 * Babel plugins.
 */
module.exports = function(jsTree) {
  let isProduction = process.env.EMBER_ENV === 'production';

  let plugins = [
    [debugMacros, {
      envFlags: {
        source: '@glimmer/env',
        flags: {
          DEBUG: !isProduction,
          CI: !!process.env.CI
        }
      },
      debugTools: {
        source: '@glimmer/debug'
      },
      externalizeHelpers: {
        module: true
      }
    }]
  ];

  if (isProduction) {
    plugins = [
      ...plugins,
      [stripGlimmerUtils, {
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