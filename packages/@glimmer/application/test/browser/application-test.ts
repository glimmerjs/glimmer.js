import Application, {
  BytecodeData,
  BytecodeLoader,
  DOMBuilder,
  RuntimeCompilerLoader,
  SyncRenderer,
  TestDelegate,
} from '@glimmer/application';
import { BundleCompiler } from '@glimmer/bundle-compiler';
import { TemplateLocator } from '@glimmer/interfaces';
import { Constants } from '@glimmer/program';
import { BlankResolver } from '@glimmer/test-utils';
import createHTMLDocument from '@simple-dom/document';

const { module, test } = QUnit;

module('[@glimmer/application] Application');

test('can be instantiated', function(assert) {
  let resolver = new BlankResolver();
  let app = new Application({
    rootName: 'app',
    loader: new RuntimeCompilerLoader(resolver),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body }),
    resolver,
  });
  assert.ok(app, 'app exists');
});

test('can be instantiated with bytecode loader', function(assert) {
  let resolver = new BlankResolver();
  let pool = new Constants().toPool();
  // let pool = new Program().constants.toPool();
  let bytecode = Promise.resolve(new ArrayBuffer(0));
  let data: BytecodeData = {
    prefix: '',
    heap: {
      table: [],
      handle: 0,
    },
    pool,
    table: [],
    mainEntry: 0,
    meta: {},
  };

  let app = new Application({
    rootName: 'app',
    loader: new BytecodeLoader({ bytecode, data }),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body }),
    resolver,
  });
  assert.ok(app, 'app exists');
});

test('can be booted with bytecode loader', async function(assert) {
  let delegate = new TestDelegate();
  let compiler = new BundleCompiler(delegate);
  let locator: TemplateLocator<null> = {
    kind: 'template',
    name: 'mainTemplate',
    module: '@glimmer/application',
    meta: null,
  };

  compiler.addTemplateSource(locator, '{{component @componentName model=@model}}');

  let result = compiler.compile();
  let resolver = new BlankResolver();
  let symbolTable = result.symbolTables.get(locator);
  let data: BytecodeData = {
    prefix: '',
    heap: {
      table: result.heap.table,
      handle: result.heap.handle,
    },
    pool: result.pool,
    table: [],
    mainEntry: result.table.vmHandleByModuleLocator.get(locator)!,
    meta: {
      mainTemplate: {
        v: result.table.vmHandleByModuleLocator.get(locator),
        h: result.table.byModuleLocator.get(locator),
        table: symbolTable,
      },
    },
  };

  let app = new Application({
    rootName: 'app',
    loader: new BytecodeLoader({ bytecode: result.heap.buffer, data }),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body }),
    resolver,
  });

  await app.boot();

  assert.ok(true, 'renders with no errors');
});

test('accepts options for rootName, resolver and document', function(assert) {
  const resolver = new BlankResolver();
  let app = new Application({
    rootName: 'app',
    loader: new RuntimeCompilerLoader(resolver),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body }),
    resolver,
  });
  assert.equal(app.rootName, 'app');
  assert.equal(app.resolver, resolver);
  assert.equal(
    app.document,
    window.document,
    'defaults to window document if document is not provided in options'
  );
  let customDocument = createHTMLDocument();

  app = new Application({
    rootName: 'app',
    resolver,
    document: customDocument,
    loader: new RuntimeCompilerLoader(resolver),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body }),
  });
  assert.equal(app.document, customDocument);
});
