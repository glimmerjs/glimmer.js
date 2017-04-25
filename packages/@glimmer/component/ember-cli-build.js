"use strict";

const build = require('@glimmer/build');
const CreateFile = require('broccoli-file-creator');
const packageDist = require('@glimmer/build/lib/package-dist');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const funnel = require('broccoli-funnel');
const path = require('path');

module.exports = function() {
  let vendorTrees = [
    '@glimmer/application',
    '@glimmer/application-test-helpers',
    '@glimmer/resolver',
    '@glimmer/compiler',
    '@glimmer/di',
    '@glimmer/object-reference',
    '@glimmer/reference',
    '@glimmer/runtime',
    '@glimmer/syntax',
    '@glimmer/util',
    '@glimmer/wire-format',
  ].map(packageDist);

  vendorTrees.push(new CreateFile('glimmer-env.js', `
    define('@glimmer/env', ['exports'], function(exports) {
      'use strict';

      exports.__esModule = true;
      exports.DEBUG = ${process.env.TEST_MODE === 'debug'};
    });
  `));

  vendorTrees.push(buildVendorPackage('simple-html-tokenizer'));
  vendorTrees.push(funnel(path.dirname(require.resolve('handlebars/package')), {
      include: ['dist/handlebars.amd.js'] }));

  return build({
    vendorTrees,
    external: [
      '@glimmer/application',
      '@glimmer/resolver',
      '@glimmer/compiler',
      '@glimmer/reference',
      '@glimmer/util',
      '@glimmer/runtime',
      '@glimmer/di',
      '@glimmer/env'
    ]
  });
}
