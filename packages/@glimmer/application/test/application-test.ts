import Application from '../src/application';
import { BlankResolver } from './test-helpers/resolvers';

const { module, test } = QUnit;

module('Application');

test('can be instantiated', function(assert) {
  let app = new Application({ rootName: 'app', resolver: new BlankResolver });
  assert.ok(app, 'app exists');
});
