import Application from '../src/index';
import { BlankResolver } from './test-helpers/resolvers';
import { Document } from 'simple-dom';

const { module, test } = QUnit;

module('Application');

test('can be instantiated', function(assert) {
  let app = new Application({ rootName: 'app', resolver: new BlankResolver });
  assert.ok(app, 'app exists');
});

test('accepts options for rootName, resolver and document', function(assert) {
  const resolver = new BlankResolver;
  let app = new Application({ rootName: 'app', resolver });
  assert.equal(app.rootName, 'app');
  assert.equal(app.resolver, resolver);
  assert.equal(app.document, window.document, 'defaults to window document if document is not provided in options');
  let customDocument = new Document();
  app = new Application({ rootName: 'app', resolver, document: customDocument });
  assert.equal(app.document, customDocument);
});
