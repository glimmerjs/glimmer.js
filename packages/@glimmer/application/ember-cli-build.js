const build = require('@glimmer/build');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const packageDist = require('@glimmer/build/lib/package-dist');
const buildTestsIndex = require('@glimmer/build/lib/build-tests-index');
const funnel = require('broccoli-funnel');
const path = require('path');
const GlimmerTemplatePrecompiler = require('ember-build-utilities').GlimmerTemplatePrecompiler;
const CreateFile = require('broccoli-file-creator');

module.exports = function() {
  let isTest = process.env.EMBER_ENV === 'test' || process.env.BROCCOLI_ENV === 'tests';

  let external = [
    '@glimmer/compiler',
    '@glimmer/component',
    '@glimmer/di',
    '@glimmer/env',
    '@glimmer/object-reference',
    '@glimmer/reference',
    '@glimmer/runtime',
    '@glimmer/syntax',
    '@glimmer/util',
    '@glimmer/wire-format',
    '@glimmer/resolver'
  ];

  if (isTest) {
    external.push('@glimmer/application-test-helpers');
  }

  let vendorTrees = external.map(packageDist);

  vendorTrees.push(buildVendorPackage('simple-html-tokenizer'));
  vendorTrees.push(funnel(path.dirname(require.resolve('handlebars/package')), {
    include: ['dist/handlebars.amd.js']
  }));

  let srcPath = path.join(__dirname, 'src');
  let tsAndJs = funnel(srcPath, {
    include: ['**/*.ts', '**/*.js'],
    destDir: 'src'
  });

  let templates = funnel(srcPath, {
    include: ['**/*.hbs'],
    destDir: 'src'
  });

  let compiledTemplates = new GlimmerTemplatePrecompiler(templates, {
    rootName: '-application'
  });

  let srcTrees = [
    tsAndJs,
    compiledTemplates
  ];

  if (isTest) {
    let testsIndex = buildTestsIndex('test', 'index.ts');

    srcTrees.push(funnel(testsIndex, { destDir: 'test' }));
    srcTrees.push(funnel(path.join(__dirname, 'test'), {
      include: ['**/*.ts'],
      destDir: 'test'
    }));

    vendorTrees.push(buildVendorPackage('simple-dom'));
  }

  vendorTrees.push(new CreateFile('glimmer-env.js', `
    define('@glimmer/env', ['exports'], function(exports) {
      'use strict';

      exports.__esModule = true;
      exports.DEBUG = ${process.env.TEST_MODE === 'debug'};
    });
  `));

  return build({
    srcTrees,
    vendorTrees,
    external
  });
};
