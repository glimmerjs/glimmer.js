const build = require('@glimmer/build');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');

let buildOptions = {};

if (process.env.BROCCOLI_ENV === 'tests') {
  buildOptions.vendorTrees = [
    buildVendorPackage('@glimmer/di', {
      external: ['babel-helpers', '@glimmer/util'] }),
    buildVendorPackage('@glimmer/util', {
      external: ['babel-helpers'] })
  ];
}

module.exports = build(buildOptions);
