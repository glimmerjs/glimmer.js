'use strict';

const babel = require('broccoli-babel-transpiler');

/**
 * Transpiles a tree of ES2015+ JavaScript files to ES5 with Babel.
 */
module.exports = function transpileToES5(inputNode, modules = false) {
  return babel(inputNode, {
    annotation: 'Babel - ES5',
    sourceMaps: 'inline',
    moduleIds: true,
    presets: [
      ['@babel/preset-env', {
        loose: true,
        modules,
        exclude: [
          'transform-regenerator',
          // Transforms all `typeof` checks to account for Symbol, which we don't
          // rely on, so can safely skip.
          'transform-typeof-symbol'
        ]
      }]
    ],
    plugins: [
      // Required for tests to pass in IE <=10, which rely on inheritance of
      // static class methods. This doesn't work in IE 10 and below so we
      // statically copy properties off __proto__ at class definition time.
      '@babel/plugin-transform-proto-to-assign',
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ]
  });
}
