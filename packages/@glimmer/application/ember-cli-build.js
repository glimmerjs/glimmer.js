const build = require('@glimmer/build');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const packageDist = require('@glimmer/build/lib/package-dist');
const buildTestsIndex = require('@glimmer/build/lib/build-tests-index');
const funnel = require('broccoli-funnel');
const path = require('path');
const GlimmerTemplatePrecompiler = require('./build/glimmer-template-precompiler');

module.exports = function() {
  let isTest = process.env.EMBER_ENV === 'test' || process.env.BROCCOLI_ENV === 'tests';

  let vendorTrees = [
    '@glimmer/compiler',
    '@glimmer/di',
    '@glimmer/object-reference',
    '@glimmer/reference',
    '@glimmer/runtime',
    '@glimmer/syntax',
    '@glimmer/util',
    '@glimmer/wire-format',
    '@glimmer/resolver'
  ].map(packageDist);

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
  }

  return build({ srcTrees, vendorTrees });
}
