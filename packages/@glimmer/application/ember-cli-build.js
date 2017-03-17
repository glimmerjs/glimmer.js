const build = require('@glimmer/build');
const buildVendorPackage = require('@glimmer/build/lib/build-vendor-package');
const funnel = require('broccoli-funnel');
const path = require('path');

module.exports = function() {
  let buildOptions = {};

  if (process.env.EMBER_ENV === 'test') {
    buildOptions.vendorTrees = [
      buildVendorPackage('@glimmer/compiler', { 
        external: ['babel-helpers', '@glimmer/syntax', '@glimmer/wire-format', '@glimmer/util'] }),
      buildVendorPackage('@glimmer/di', { 
        external: ['babel-helpers'] }),
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
        external: ['babel-helpers', '@glimmer/util', 'handlebars', 'simple-html-tokenizer'] }),
      buildVendorPackage('@glimmer/util', { 
        external: ['babel-helpers'] }),
      buildVendorPackage('@glimmer/wire-format', { 
        external: ['@glimmer/util'] }),
      buildVendorPackage('simple-html-tokenizer'),
      funnel(path.dirname(require.resolve('handlebars/package')), { 
        include: ['dist/handlebars.amd.js'] })
    ];
  }

  return build(buildOptions);
}

function includeVendorPackage(name) {
  // Resolve package's `package.json`, in case `main` is set and it points deep
  // into a `dist` directory.
  let packagePath = require.resolve(`${name}/package`);
  packagePath = path.dirname(packagePath);

  return funnel(packagePath, {
    include: [
      'dist/amd/es5/**/*.js',
      'amd/es5/**/*.js'
    ]
  });
}
