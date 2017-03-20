const build = require('@glimmer/build');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const packageDist = require('@glimmer/build/lib/package-dist');
const funnel = require('broccoli-funnel');
const path = require('path');

module.exports = function() {
  let vendorTrees = [
    '@glimmer/compiler',
    '@glimmer/di',
    '@glimmer/object-reference',
    '@glimmer/reference',
    '@glimmer/runtime',
    '@glimmer/syntax',
    '@glimmer/util',
    '@glimmer/wire-format'
  ].map(packageDist);

  vendorTrees.push(buildVendorPackage('simple-html-tokenizer'));
  vendorTrees.push(funnel(path.dirname(require.resolve('handlebars/package')), { 
    include: ['dist/handlebars.amd.js']
  }));

  return build({ vendorTrees });
}