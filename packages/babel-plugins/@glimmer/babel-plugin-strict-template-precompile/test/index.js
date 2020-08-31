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
  ],
});

describe('precompileTemplate', () => {
  it('works for basic templates', () => {
    let precompiled = precompileTemplate(`<Component/>`);

    expect(precompiled).to.equal(`({
  id: "mtRxClUL",
  block: "{\\"symbols\\":[],\\"statements\\":[[8,\\"Component\\",[],[[],[]],null]],\\"hasEval\\":false,\\"upvars\\":[]}",
  meta: {
    scope: () => ({})
  }
});`);
  });

  it('works with imports', () => {
    let precompiled = precompileTemplate(`<Component/>`, ['Component']);

    expect(precompiled).to.equal(`({
  id: "mtRxClUL",
  block: "{\\"symbols\\":[],\\"statements\\":[[8,\\"Component\\",[],[[],[]],null]],\\"hasEval\\":false,\\"upvars\\":[]}",
  meta: {
    scope: () => ({
      Component: Component
    })
  }
});`);
  });

  it('can apply precompile transforms', () => {
    let precompiled = precompileTemplate(
      '{{bad}}<h1>Hello world</h1>',
      [],
      astTransformTestPluginOptions.precompile
    );

    expect(precompiled).to.equal(`({
  id: "iLYq0mJl",
  block: "{\\"symbols\\":[],\\"statements\\":[[10,\\"h1\\"],[12],[2,\\"Hello world\\"],[13]],\\"hasEval\\":false,\\"upvars\\":[]}",
  meta: {
    scope: () => ({})
  }
});`);
  });
});
