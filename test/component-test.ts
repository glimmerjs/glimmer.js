import { getOwner, setOwner, Owner } from '@glimmer/di';
import Component, { ComponentOptions } from '../src/component';

const { module, test } = QUnit;

module('Component');

class FakeApp implements Owner {
  identify(specifier: string, referrer?: string) { return ''; }
  factoryFor(specifier: string, referrer?: string) { return null; }
  lookup(specifier: string, referrer?: string) { return null; }
}

test('can be instantiated with an owner', function(assert) {
  let owner: Owner = new FakeApp;
  let options: ComponentOptions = {};
  setOwner(options, owner);
  let component = new Component(options);
  assert.ok(component, 'component exists');
  assert.strictEqual(getOwner(component), owner, 'owner has been set');
});

test('can be instantiated with an owner and args', function(assert) {
  let owner: Owner = new FakeApp;
  let args = {
    a: 'a',
    b: 'b'
  };
  let options: ComponentOptions = { args };
  setOwner(options, owner);
  let component = new Component(options);
  assert.deepEqual(component.args, args, 'args have been assigned');
  assert.strictEqual(getOwner(component), owner, 'owner has been set');
});
