#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');

const exec = promisify(require('child_process').exec);
const glob = promisify(require('glob'));

(async function() {
  process.chdir(path.join(__dirname, '..'));

  await buildTypescript('dist/modules', 'es2015');
  await buildTypescript('dist/commonjs', 'commonjs');

  const packages = (await glob('dist/modules/{@*/*,!(@*)}'))
    .map(pkg => pkg.replace('dist/modules/', ''))
    .flatMap(pkg => [
      {
        from: path.join('dist', 'commonjs', pkg),
        to: path.join('packages', pkg, 'dist', 'commonjs'),
      },
      {
        from: path.join('dist', 'modules', pkg),
        to: path.join('packages', pkg, 'dist', 'modules'),
      },
    ]);

  await remove(packages.map(pkg => pkg.to));
  await createDirs(packages.map(pkg => pkg.to));
  await move(packages);

  console.log('\n\nDone');
})();

async function buildTypescript(outDir, moduleKind = 'es2015') {
  try {
    await exec(`node_modules/.bin/tsc -p . --outDir ${outDir} -m ${moduleKind}`);
  } catch (err) {
    if (err.stdout) {
      console.log(err.stdout.toString());
    } else {
      throw err;
    }
  }
}

function createDirs(paths) {
  return each(paths, pathOfDir => {
    console.log(`Creating Dir ${pathOfDir}`);
    return fs.mkdirp(pathOfDir);
  });
}

function remove(paths) {
  return each(paths, pathOfDir => {
    console.log(`Removing ${pathOfDir}`);
    return fs.remove(pathOfDir);
  });
}

function move(paths) {
  return each(paths, ({ from, to }) => {
    console.log(`Moving ${from} -> ${to}`);
    return fs.rename(from, to);
  });
}

function each(paths, cb) {
  return Promise.all(paths.map(cb));
}
