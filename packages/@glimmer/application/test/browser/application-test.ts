import Application, { RuntimeCompilerLoader, SyncRenderer, DOMBuilder, BytecodeLoader, BytecodeData } from '@glimmer/application';
import { BlankResolver } from '@glimmer/test-utils';
import { Document } from 'simple-dom';
import { Program } from '@glimmer/program';
import { BundleCompiler, BundleCompilationResult } from '@glimmer/bundle-compiler';
import { AppCompilerDelegate } from '@glimmer/compiler-delegates';
import { ComponentCapabilities, ModuleLocator, TemplateLocator } from '@glimmer/interfaces';

const { module, test } = QUnit;

class TestDelegate implements AppCompilerDelegate<any> {
  normalizePath(absolutePath: string): string {
    throw new Error("Method not implemented.");
  }
  templateLocatorFor(moduleLocator: ModuleLocator): TemplateLocator<any> {
    throw new Error("Method not implemented.");
  }
  generateDataSegment(compilation: BundleCompilationResult): string {
    throw new Error("Method not implemented.");
  }
  hasComponentInScope(componentName: string, referrer: any): boolean {
    throw new Error("Method not implemented.");
  }
  resolveComponent(componentName: string, referrer: any): ModuleLocator {
    throw new Error("Method not implemented.");
  }
  getComponentCapabilities(locator: any): ComponentCapabilities {
    throw new Error("Method not implemented.");
  }
  hasHelperInScope(helperName: string, referrer: any): boolean {
    throw new Error("Method not implemented.");
  }
  resolveHelper(helperName: string, referrer: any): ModuleLocator {
    throw new Error("Method not implemented.");
  }
  hasModifierInScope(modifierName: string, referrer: any): boolean {
    throw new Error("Method not implemented.");
  }
  resolveModifier(modifierName: string, referrer: any): ModuleLocator {
    throw new Error("Method not implemented.");
  }
  hasPartialInScope(partialName: string, referrer: any): boolean {
    throw new Error("Method not implemented.");
  }
  resolvePartial(partialName: string, referrer: any): ModuleLocator {
    throw new Error("Method not implemented.");
  }

}

module('[@glimmer/application] Application');

test('can be instantiated', function(assert) {
  let resolver = new BlankResolver();
  let app = new Application({
    rootName: 'app',
    loader: new RuntimeCompilerLoader(resolver),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body, nextSibling: null }),
    resolver
  });
  assert.ok(app, 'app exists');
});

test('can be instantiated with bytecode loader', function(assert) {
  let resolver = new BlankResolver();
  let pool = new Program().constants.toPool();
  let bytecode = Promise.resolve(new ArrayBuffer(0));
  let data: BytecodeData = {
    prefix: '',
    heap: {
      table: [],
      handle: 0
    },
    pool,
    table: [],
    mainEntry: 0,
    meta: {}
  };

  let app = new Application({
    rootName: 'app',
    loader: new BytecodeLoader({ bytecode, data }),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body, nextSibling: null }),
    resolver
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
    meta: null
  };

  compiler.add(locator, '{{component @componentName model=@model}}');

  let result = compiler.compile();
  let resolver = new BlankResolver();
  let symbolTable = result.symbolTables.get(locator);
  let data: BytecodeData = {
    prefix: '',
    heap: {
      table: result.heap.table,
      handle: result.heap.handle
    },
    pool: result.pool,
    table: [],
    mainEntry: result.table.vmHandleByModuleLocator.get(locator),
    meta: {
      'mainTemplate': {
        v: result.table.vmHandleByModuleLocator.get(locator),
        h: result.table.byModuleLocator.get(locator),
        table: symbolTable
      }
    }
  };

  let app = new Application({
    rootName: 'app',
    loader: new BytecodeLoader({ bytecode: result.heap.buffer, data }),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body, nextSibling: null }),
    resolver
  });

  await app.boot();

  assert.ok(true, 'renders with no errors');
});

test('accepts options for rootName, resolver and document', function(assert) {
  const resolver = new BlankResolver;
  let app = new Application({
    rootName: 'app',
    loader: new RuntimeCompilerLoader(resolver),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body, nextSibling: null }),
    resolver
  });
  assert.equal(app.rootName, 'app');
  assert.equal(app.resolver, resolver);
  assert.equal(app.document, window.document, 'defaults to window document if document is not provided in options');
  let customDocument = new Document();

  app = new Application({
    rootName: 'app',
    resolver,
    document: customDocument as any,
    loader: new RuntimeCompilerLoader(resolver),
    renderer: new SyncRenderer(),
    builder: new DOMBuilder({ element: document.body, nextSibling: null })
  });
  assert.equal(app.document, customDocument);
});
