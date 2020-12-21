import plugin, { precompileTemplate } from '..';
import pluginTester from 'babel-plugin-tester';
import path from 'path';
import astTransformTestPluginOptions from './fixtures-options/precompile/ast-transform/options';
import { expect } from 'chai';

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
    {
      fixture: path.join(__dirname, 'fixtures-options/errors/non-existent-component/code.js'),
      error: /Attempted to invoke a component that was not in scope in a strict mode template, `<NonExistent>`. If you wanted to create an element with that name, convert it to lowercase - `<nonexistent>`/,
    },
  ],
});

describe('precompileTemplate', () => {
  it('works for basic templates', () => {
    let precompiled = precompileTemplate(`<h1>Hello World</h1>`);

    expect(precompiled).to.equal(`({
  "id": "gPHf663l",
  "block": "[[[10,\\"h1\\"],[12],[1,\\"Hello World\\"],[13]],[],false,[]]",
  "moduleName": "(unknown template module)",
  "scope": null,
  "isStrictMode": true
});`);
  });

  it('works with imports', () => {
    let precompiled = precompileTemplate(`<Component/>`, ['Component']);

    expect(precompiled).to.equal(`({
  "id": "zK8QcLjf",
  "block": "[[[8,[32,0],null,null,null]],[],false,[]]",
  "moduleName": "(unknown template module)",
  "scope": () => [Component],
  "isStrictMode": true
});`);
  });

  it('can apply precompile transforms', () => {
    let precompiled = precompileTemplate(
      '{{bad}}<h1>Hello world</h1>',
      [],
      astTransformTestPluginOptions.precompile
    );

    expect(precompiled).to.equal(`({
  "id": "iQBI6eOx",
  "block": "[[[10,\\"h1\\"],[12],[1,\\"Hello world\\"],[13]],[],false,[]]",
  "moduleName": "(unknown template module)",
  "scope": null,
  "isStrictMode": true
});`);
  });
});
