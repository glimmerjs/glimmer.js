const nodeResolve = require('rollup-plugin-node-resolve');
const path = require('path');

const GLIMMER_PACKAGE_REGEX = /@glimmer\/(.*)$/;

module.exports = function() {
  return {
    name: 'glimmer-resolve',
    resolveId(importee, importer) {
      if (importer) {
        let match = importer.match(GLIMMER_PACKAGE_REGEX);
        if (match) {
          let glimmerPackage = match[1];
          let originalPackagePath = path.join(process.cwd(), 'packages/@glimmer', glimmerPackage);
          let basedir = path.dirname(originalPackagePath);

          let resolver = nodeResolve({
            customResolveOptions: {
              basedir,
              packageFilter(pkg) {
                if (pkg.module) {
                  pkg.main = pkg.module;
                }

                if (pkg.name === 'handlebars') {
                  pkg.main = 'lib/handlebars.js';
                }
                return pkg;
              }
            }
          });

          return resolver.resolveId(importee, importer);
        }
      }
      return null;
    }
  };
}