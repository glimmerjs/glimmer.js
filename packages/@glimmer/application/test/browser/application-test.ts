import Application, { RuntimeCompilerLoader, SyncRenderer, DOMBuilder } from '@glimmer/application';
import { BlankResolver } from '@glimmer/test-utils';
import { Document } from 'simple-dom';

const { module, test } = QUnit;

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
