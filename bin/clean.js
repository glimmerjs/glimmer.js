#!/usr/bin/env node

const fs = require('fs-extra');
const { promisify } = require('util');

const glob = promisify(require('glob'));

(async function() {
  await remove(['./tmp']);
  await remove(await glob('./packages/@glimmer/*/dist'));

  console.log('\n\nDone');
})();

function remove(paths) {
  return each(paths, pathOfDir => {
    console.log(`Removing ${pathOfDir}`);
    return fs.remove(pathOfDir);
  });
}

function each(paths, cb) {
  return Promise.all(paths.map(cb));
}
