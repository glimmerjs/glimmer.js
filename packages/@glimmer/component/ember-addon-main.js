'use strict';

const writeFile = require('broccoli-file-creator');
const MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: '@glimmer/component',

  included(includer) {
    let pkg = 'pkg' in includer ? includer.pkg : includer.project.pkg;

    if (
      (pkg.dependencies && '@glimmer/application' in pkg.dependencies) ||
      (pkg.devDependencies && '@glimmer/application' in pkg.devDependencies)
    ) {
      // this is a Glimmer application, don't include nested addons or run addon code
      return;
    }

    this._super.included.apply(this, arguments);
  },
};
