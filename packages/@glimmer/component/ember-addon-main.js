'use strict';

const writeFile = require('broccoli-file-creator');
const MergeTrees = require('broccoli-merge-trees');
const VersionChecker = require('ember-cli-version-checker');

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

  treeForAddon(tree) {
    let ownerOverride = writeFile(
      '-private/owner.ts',
      `
        export { setOwner } from '@ember/application';
      `
    );

    let trees = [
      tree,
      ownerOverride,
    ];

    let checker = new VersionChecker(this.project);
    let dep = checker.for('ember-source');

    // Ember shipped public API directly, this is more likely to be stable over time
    if (dep.gte('3.22.0-beta.1')) {
      let destroyablesOverride = writeFile(
        '-private/destroyables.ts',
        `
        import Ember from 'ember';

        export const isDestroying = Ember._isDestroying;
        export const isDestroyed = Ember._isDestroyed;
      `
      );

      trees.push(destroyablesOverride);
    } else if (dep.gte('3.20.0-beta.4')) {
      // using internals to access from `@glimmer/runtime`

      let destroyablesOverride = writeFile(
        '-private/destroyables.ts',
        `
        import Ember from 'ember';

        export const isDestroying = Ember.__loader.require('@glimmer/runtime').isDestroying;
        export const isDestroyed = Ember.__loader.require('@glimmer/runtime').isDestroyed;
      `
      );

      trees.push(destroyablesOverride);
    }

    return this._super.treeForAddon.call(
      this,
      new MergeTrees(trees, {
        overwrite: true,
      })
    );
  },
};
