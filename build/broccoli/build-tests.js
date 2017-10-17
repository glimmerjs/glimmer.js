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

/**
 * For development, this returns a Broccoli tree with:
 *
 * 1. All of Glimmer's AMD modules, concatenated into glimmer-vm.js.
 * 2. Test files as AMD modules.
 * 3. A test harness, including HTML page, QUnit, dependencies, etc.
 */
module.exports = function(tsTree, jsTree, packagesTree) {
  packagesTree = funnel(packagesTree, {
    destDir: 'glimmer-packages'
  });

  jsTree = merge([jsTree, packagesTree]);

  let browserTests = merge([
    includeTestHarness(),
    generateTSLintTests(tsTree),
    rollupTests(jsTree)
  ]);

  browserTests = funnel(browserTests, {
    destDir: 'tests'
  });

  return browserTests;
}

function rollupTests(packagesTree) {
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

function generateTSLintTests(tsTree) {
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
