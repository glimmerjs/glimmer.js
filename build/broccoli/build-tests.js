'use strict';

const path = require('path');
const merge = require('broccoli-merge-trees');
const funnel = require('broccoli-funnel');
const concat = require('broccoli-concat');
const Rollup = require('broccoli-rollup');
const TSLint = require('broccoli-tslinter');

const nodeResolve = require('rollup-plugin-node-resolve');
const monorepo = require('../rollup/monorepo-resolve');
const handlebarsCompat = require('../rollup/handlebars-compat');

const buildTestsIndex = require('./build-tests-index');
const optimize = require('./optimize');

/**
 * For running tests, this function returns a Broccoli tree with:
 *
 * 1. All of Glimmer.js's tests, bundled into tests.js with Rollup.
 * 3. A test harness, including an HTML page and QUnit.
 */
module.exports = function(tsTree, jsTree, packagesTree) {
  packagesTree = funnel(packagesTree, {
    destDir: 'glimmer-packages'
  });

  jsTree = merge([jsTree, packagesTree]);

  // We include a number of assertions and logging information that can be
  // statically optimized in development builds and stripped entirely from
  // production builds for better runtime performance.
  jsTree = optimize(jsTree);

  let browserTests = merge([
    includeTests(jsTree),
    includeTSLintTests(tsTree),
    includeTestHarness()
  ]);

  browserTests = funnel(browserTests, {
    destDir: 'tests'
  });

  return browserTests;
}

function includeTests(packagesTree) {
  let testsIndex = buildTestsIndex();
  let testsRoot = merge([testsIndex, packagesTree]);

  return new Rollup(testsRoot, {
    rollup: {
      format: 'es',
      entry: ['tests.js'],
      dest: 'assets/tests.js',
      plugins: [
        monorepo(),
        handlebarsCompat(),
        nodeResolve({
          // Chad's broccoli-rollup plugin symlinks a node_modules directory at
          // the root and there's no option to disable it, so I had to rename
          // the directory from node_modules to glimmer-packages to avoid a
          // conflict. This setting tells the resolver to treat
          // 'glimmer-packages' with the same lookup semantics as
          // 'node_modules'.
          customResolveOptions: {
            moduleDirectory: 'glimmer-packages'
          }
        })
      ]
    }
  });
}

function includeTSLintTests(tsTree) {
  // The TSLint plugin passes through all files, so we need to filter out any
  // non-TypeScript files.
  tsTree = funnel(tsTree, {
    include: ['**/*.ts'],
    srcDir: 'packages'
  });

  let tslintConfig = __dirname + '/../../tslint.json';
  let tslintTree = new TSLint(tsTree, {
    configuration: tslintConfig
  });

  return concat(tslintTree, {
    outputFile: 'assets/tslint.js'
  });
}

function includeTestHarness() {
  let html = funnel('test', {
    include: ['index.html']
  });

  let qunit = funnel(path.join(require.resolve('qunitjs'), '..'), {
    destDir: 'assets/'
  });

  let harnessTrees = [
    html,
    qunit
  ];

  return merge(harnessTrees);
}
