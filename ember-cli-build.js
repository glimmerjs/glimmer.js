/*jshint node:true*/

const merge = require('broccoli-merge-trees');
const funnel = require('broccoli-funnel');
const typescript = require('broccoli-typescript-compiler').default;

const buildTests = require('./build/broccoli/build-tests');
const buildPackages = require('./build/broccoli/build-packages.js');
const mergeDefinitionFiles = require('./build/broccoli/merge-definition-files');
const GlimmerTemplatePrecompiler = require('ember-build-utilities').GlimmerTemplatePrecompiler;

const PRODUCTION = process.env.EMBER_ENV === 'production';

/**
 * For development, we build for ES5 AMD (browser tests) and CommonJS (Node
 * tests). For production builds, we omit tests but include all target
 * formats.
 */
module.exports = function(_options) {
  // First, get all of our TypeScript packages while preserving their relative
  // path in the filesystem. This is important because tsconfig.json paths are
  // relative to the project root and we want to use the tsconfig as-is.
  let tsTree = funnel('packages/', {
    destDir: 'packages/',
    exclude: ['**/node_modules/**']
  });

  // We'll also grab any files that are authored in JavaScript directly
  // (which includes things like some test files).
  let jsTree = funnel('packages/', {
    include: ['**/*.js'],
    exclude: ['**/node_modules/**', '@glimmer/component/**']
  });

  // Second, compile all of the TypeScript into ES2017 JavaScript. Because the
  // TypeScript compiler understands the project as a whole, it's faster to do
  // this once and use the transpiled JavaScript as the input to any further
  // transformations. We then merge the transpiled JS back in with any files
  // authored in JS originally.
  jsTree = merge([jsTree, typescript(tsTree)]);

  // The TypeScript compiler doesn't emit `.d.ts` files, so we need to manually
  // merge them back into our JavaScript output.
  jsTree = mergeDefinitionFiles(tsTree, jsTree);

  // Third, gather any Handlebars templates and compile them.
  let templates = funnel(tsTree, {
    srcDir: 'packages/',
    include: ['**/*.hbs']
  });

  let compiledTemplates = new GlimmerTemplatePrecompiler(templates, {
    rootName: '-application'
  });
  compiledTemplates.targetExtension = 'js';

  jsTree = merge([compiledTemplates, jsTree]);

  let matrix;

  if (PRODUCTION) {
    matrix = [
      ['commonjs', 'es2017'],
      ['commonjs', 'es5'],
      ['modules', 'es2017'],
      ['modules', 'es5'],
      ['types']
    ];
  } else {
    matrix = [
      ['modules', 'es2017'],
      ['commonjs', 'es2017']
    ];
  }

  // Include any Ember Addon files, without src (Glimmer files)
  let emberTree = funnel('packages/', {
    exclude: [
      '**/node_modules',
      '**/tmp',
      '**/types',
      '**/dist',
      '**/src',
      '**/test',
      '*/*/index.ts'
    ]
  });

  // Third, build our module/ES combinations for each package, and their tests.
  let packagesTree = buildPackages(jsTree, matrix);
  let testsTree = buildTests(tsTree, jsTree, packagesTree);

  return merge([packagesTree, testsTree, emberTree], { overwrite: true });
}
