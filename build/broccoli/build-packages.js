'use strict';

const funnel = require('broccoli-funnel');
const babel = require('broccoli-babel-transpiler');
const merge = require('broccoli-merge-trees');

const transpileToES5 = require('./transpile-to-es5');
const writePackageJSON = require('./write-package-json');
const writeLicense = require('./write-license');

const Project = require('../utils/project');
const project = Project.from('packages');

module.exports = function buildPackages(es2017, matrix) {
  // Filter out test files from the package builds.
  es2017 = funnel(es2017, {
    exclude: ['**/test/**']
  });

  // Create an ES5 version of the higher-fidelity ES2017 code.
  let es5 = transpileToES5(es2017);
  let targets = { es5, es2017 };

  // We ignore the `@glimmer/blueprint` tree as it is ember-only, and is picked
  // up later on in the build process.
  let packages = project.packages
    .filter(pkg => pkg.name !== '@glimmer/blueprint')
    .map(buildPackage);

  packages = flatten(packages);
  packages = merge(flatten(packages), { overwrite: true });

  return packages;

  function buildPackage(pkg) {
    return [
      writePackageJSON(pkg.name),
      writeLicense(`${pkg.name}/LICENSE`),
      ...buildMatrix(pkg.name, matrix)
    ];
  }

  function buildMatrix(pkgName) {
    return matrix.map(([modules, target]) => {
      let source = targets[target];
      switch (modules) {
        case 'commonjs':
          return transpileCommonJS(pkgName, target, source);
        case 'modules':
          return copyESModules(pkgName, target, source);
        case 'types':
          return copyTypes(pkgName, targets.es2017);
        default:
          throw new Error(`Unsupported module target '${target}'.`);
      }
    });
  }
}

function flatten(arr) {
  return arr.reduce((out, cur) => out.concat(cur), []);
}

function copyESModules(pkgName, target, source) {
  return funnel(source, {
    srcDir: pkgName,
    destDir: `${pkgName}/dist/modules/${target}/`,
    exclude: ['**/*.d.ts']
  });
}

function copyTypes(pkg, source) {
  return funnel(source, {
    srcDir: pkg,
    include: ['**/*.d.ts'],
    destDir: `${pkg}/dist/types`
  });
}

function transpileCommonJS(pkgName, esVersion, tree) {
  let pkgTree = funnel(tree, {
    include: [`${pkgName}/**/*`],
    exclude: ['**/*.d.ts']
  });

  let options = {
    annotation: `Transpile CommonJS - ${pkgName} - ${esVersion}`,
    plugins: ['transform-es2015-modules-commonjs'],
    sourceMaps: 'inline'
  };

  let commonjsTree = babel(pkgTree, options);

  return funnel(commonjsTree, {
    srcDir: pkgName,
    destDir: `${pkgName}/dist/commonjs/${esVersion}`
  });
}
