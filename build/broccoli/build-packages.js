'use strict';

const funnel = require('broccoli-funnel');
const babel = require('broccoli-babel-transpiler');
const merge = require('broccoli-merge-trees');
const concat = require('broccoli-concat');
const resolveModuleSource = require('amd-name-resolver').moduleResolve;

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

  let packages = project.packages
    .map(buildPackage);

  packages = flatten(packages);
  packages = merge(flatten(packages), { overwrite: true });

  return packages;

  function buildPackage(pkg) {
    let pkgName = pkg.name;
    let builds;

    // The blueprint package is structured differently from other packages, so
    // we just copy it over verbatim to the build output.
    if (pkgName === '@glimmer/blueprint') {
      builds = [funnel(`packages/${pkgName}`, {
        destDir: `${pkgName}/`,
        exclude: ['**/node_modules/**']
      })];
    } else {
      builds = buildMatrix(pkgName, matrix);
    }

    return [
      writePackageJSON(pkgName),
      writeLicense(`${pkgName}/LICENSE`),
      ...builds
    ];
  }

  function buildMatrix(pkgName) {
    return matrix.map(([modules, target]) => {
      let source = targets[target];
      switch (modules) {
        case 'amd':
          return transpileAMD(pkgName, target, source);
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

function transpileAMD(pkgName, esVersion, tree) {
  let bundleName = pkgName.replace('/', '-').replace('@', '');
  let pkgTree = funnel(tree, {
    include: [`${pkgName}/**/*`],
    exclude: ['**/*.d.ts']
  });

  let amd = babel(pkgTree, {
    moduleId: true,
    resolveModuleSource,
    plugins: [['transform-es2015-modules-amd', { noInterop: true, strict: true }]]
  });

  return concat(amd, {
   inputFiles: ['**/*'],
   sourceMapConfig: { enabled: false },
   outputFile: `/${pkgName}/dist/amd/${esVersion}/${bundleName}.js`
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
