const merge = require('broccoli-merge-trees');
const funnel = require('broccoli-funnel');

/**
 * The TypeScript compiler doesn't re-emit input `.d.ts` files, so we manually
 * merge type definitions directly from source into the built output.
 */
module.exports = function(tsTree, jsTree) {
  let definitionsTree = funnel(tsTree, {
    srcDir: 'packages',
    include: ['**/*.d.ts']
  });

  return merge([jsTree, definitionsTree]);
}
