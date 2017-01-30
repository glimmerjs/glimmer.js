import { getOwner, setOwner, Owner } from '@glimmer/di';
import Component from '../src/component';

const { module, test } = QUnit;

module('Component');

test('can be instantiated with new', function(assert) {
  let component = new Component();
  assert.ok(component, 'component exists');
});

test('can be instantiated with create', function(assert) {
  let component = Component.create();
  assert.ok(component, 'component exists');
});

test('can be assigned args', function(assert) {
  let args = {
    a: 'a',
    b: 'b'
  };
  let component = Component.create(args);
  assert.deepEqual(component.args, args, 'args have been assigned');
});

test('can be assigned args and an owner', function(assert) {
  class FakeApp implements Owner {
    identify(specifier: string, referrer?: string) { return ''; }
    factoryFor(specifier: string, referrer?: string) { return null; }
    lookup(specifier: string, referrer?: string) { return null; }
  }
  let app = new FakeApp;

  let args = {
    a: 'a',
    b: 'b'
  };

  setOwner(args, app);

  let component = Component.create(args);
  assert.deepEqual(component.args, {a: 'a', b: 'b'}, 'args have been assigned');
  assert.strictEqual(getOwner(component), app, 'owner has been set');
});
