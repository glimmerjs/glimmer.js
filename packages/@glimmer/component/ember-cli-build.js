"use strict";

const build = require('@glimmer/build');
const CreateFile = require('broccoli-file-creator');
const packageDist = require('@glimmer/build/lib/package-dist');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const funnel = require('broccoli-funnel');
const path = require('path');

module.exports = function() {
  let isTest = process.env.EMBER_ENV === 'test' || process.env.BROCCOLI_ENV === 'tests';

  let external = [
    '@glimmer/compiler',
    '@glimmer/di',
    '@glimmer/object-reference',
    '@glimmer/reference',
    '@glimmer/resolver',
    '@glimmer/runtime',
    '@glimmer/syntax',
    '@glimmer/util',
    '@glimmer/wire-format',
  ];

  if (isTest) {
    external.push('@glimmer/application');
    external.push('@glimmer/application-test-helpers');
  }

  let vendorTrees = external.map(packageDist);

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
    external
  });
}
