import plugin from '..';
import pluginTester from 'babel-plugin-tester';
import path from 'path';
import astTransformTestPluginOptions from './fixtures-options/precompile/ast-transform/options';

// For correct .babelrc detection inside the fixture directory we need to force babel's cwd and root to be the package root.
// This will ensure that the tests will run correctly from the mono repo root or package root.
const packageRootPath = path.resolve(__dirname, '..');

pluginTester({
  plugin,
  babelOptions: {
    cwd: packageRootPath,
    root: packageRootPath,
  },
  fixtures: path.join(__dirname, 'fixtures'),
  tests: [
    {
      title: 'options.precompile : ast transfrom',
      fixture: path.join(__dirname, 'fixtures-options/precompile/ast-transform/code.js'),
      outputFixture: path.join(__dirname, 'fixtures-options/precompile/ast-transform/output.js'),
      pluginOptions: astTransformTestPluginOptions,
    },
  ],
});
