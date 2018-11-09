const path = require('path');
const Funnel = require('broccoli-funnel');
const BroccoliDebug = require('broccoli-debug');
const MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: '<%= name %>',
  blueprintsPath() {
    return null;
  },
  preprocessTree(type, tree) {
    if (type === 'src') {
      let debugTree = BroccoliDebug.buildDebugCallback(`<%= name %>`);

      let addonSrcTree = debugTree(new Funnel(path.join(__dirname, 'src', 'addon'), 'addonSrcTree'));

      tree = debugTree(tree, 'srcTree');

      let outputTree = debugTree(new MergeTrees([addonSrcTree, tree]), 'outputTree')

      return outputTree;
    } else {
      return tree;
    }
  }
}