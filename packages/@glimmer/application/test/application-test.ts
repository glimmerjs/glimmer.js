import Application from '../src/application';

const { module, test } = QUnit;

module('Application');

test('can be instantiated', function(assert) {
  let app = new Application({ rootName: 'app' });
  assert.ok(app, 'app exists');
});
