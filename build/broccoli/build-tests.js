'use strict';

const path = require('path');
const merge = require('broccoli-merge-trees');
const funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');

const nodeResolve = require('rollup-plugin-node-resolve');
const monorepo = require('../rollup/monorepo-resolve');
const handlebarsCompat = require('../rollup/handlebars-compat');

const buildTestIndex = require('./build-tests-index');
const optimize = require('./optimize');

/**
 * For running tests, this function returns a Broccoli tree with:
 *
 * 1. All of Glimmer.js's tests, bundled into tests.js with Rollup.
 * 3. A test harness, including an HTML page and QUnit.
 */
module.exports = function(tsTree, jsTree, packagesTree) {
  return merge([
    buildBrowserTests(tsTree, jsTree, packagesTree),
    buildNodeTests(jsTree, packagesTree)
  ]);
}

function buildBrowserTests(tsTree, jsTree, packagesTree) {
  // Make the built packages available to the tests. Due to a conflict with
  // broccoli-rollup, we can't call this node_modules.
  packagesTree = funnel(packagesTree, {
    destDir: 'glimmer-node_modules'
  });

  jsTree = merge([jsTree, packagesTree]);

  // We include a number of assertions and logging information that can be
  // statically optimized in development builds and stripped entirely from
  // production builds for better runtime performance.
  jsTree = optimize(jsTree);

  let browserTests = merge([
    includeTests(jsTree),
    includeTestHarness()
  ]);

  browserTests = funnel(browserTests, {
    destDir: 'tests/browser'
  });

  return browserTests;
}

function includeTests(jsTree) {
  let testsIndex = buildTestIndex(jsTree, {
    filter: '@glimmer/*/test/{!(node)/**/,}*-test.{js,ts}',
    outputFile: 'tests.js'
  });

  let testsRoot = merge([testsIndex, jsTree]);

  return new Rollup(testsRoot, {
    rollup: {
      format: 'iife',
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
            moduleDirectory: 'glimmer-node_modules'
          }
        })
      ]
    }
  });
}

function includeTestHarness() {
  let html = funnel('test', {
    include: ['index.html']
  });

  let qunit = funnel(path.join(require.resolve('qunit'), '..'), {
    destDir: 'assets/'
  });

  let harnessTrees = [
    html,
    qunit
  ];

  return merge(harnessTrees);
}

// Matches npm package names, either @scope/my-pkg my-pkg
const PACKAGE_NAME_RE = /^(@[\d\w-]+\/[\d\w-]+|[\d\w-]+)$/;

function buildNodeTests(jsTree, packagesTree) {
  jsTree = optimize(jsTree);

  let testsIndex = buildTestIndex(jsTree, {
    filter: '@glimmer/*/test/{!(browser)/**/,}*-test.{js,ts}',
    outputFile: 'tests.js'
  });

  testsIndex = merge([testsIndex, jsTree]);

  let nodeTests = new Rollup(testsIndex, {
    rollup: {
      format: 'cjs',
      entry: ['tests.js'],
      dest: 'tests.js',
      external: id => id.match(PACKAGE_NAME_RE)
    }
  });

  // Unlike in the browser tests, where Rollup needs to be able to resolve
  // packages during bundling, we can add the built packages in *after* the
  // Rollup build because they don't need to be available until runtime.
  packagesTree = funnel(packagesTree, {
    destDir: 'node_modules'
  });

  nodeTests = merge([ nodeTests, packagesTree ]);

  return funnel(nodeTests, {
    destDir: 'tests/node'
  });
}
