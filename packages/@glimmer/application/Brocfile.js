const build = require('@glimmer/build');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const funnel = require('broccoli-funnel');
const path = require('path');

let buildOptions = {};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    buildVendorPackage('@glimmer/compiler', { 
      external: ['babel-helpers', '@glimmer/syntax', '@glimmer/wire-format', '@glimmer/util'] }),
    buildVendorPackage('@glimmer/component', { 
      external: ['babel-helpers', '@glimmer/di', '@glimmmer/reference', '@glimmer/runtime', '@glimmer/object-reference', '@glimmer/util'] }),
    buildVendorPackage('@glimmer/di', { 
      external: ['babel-helpers', '@glimmer/util'] }),
    buildVendorPackage('@glimmer/object-reference', { 
      external: ['babel-helpers', '@glimmer/util', '@glimmer/reference'] }),
    buildVendorPackage('@glimmer/reference', { 
      external: ['babel-helpers', '@glimmer/util'] }),
    buildVendorPackage('@glimmer/runtime', {
      external: ['babel-helpers', 
                 '@glimmer/util',
                 '@glimmer/reference',
                 '@glimmer/wire-format',
                 '@glimmer/syntax']}),
    buildVendorPackage('@glimmer/syntax', { 
      external: ['babel-helpers', 'handlebars', 'simple-html-tokenizer'] }),
    buildVendorPackage('@glimmer/util', { 
      external: ['babel-helpers'] }),
    buildVendorPackage('@glimmer/wire-format', { 
      external: ['@glimmer/util'] }),
    buildVendorPackage('simple-html-tokenizer'),
    funnel(path.dirname(require.resolve('handlebars/package')), { 
      include: ['dist/handlebars.amd.js'] })
  ];
}

module.exports = build(buildOptions);
