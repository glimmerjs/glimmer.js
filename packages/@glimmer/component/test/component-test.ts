import buildApp from './test-helpers/test-app';
import { getOwner } from '@glimmer/di';

const { module, test } = QUnit;

module('Component');

test('can be instantiated with an owner', function(assert) {
  let component: Component;

  class Component {
    element: Element;

    static create(injections) {
      return new this(injections);
    }

    constructor(injections: any) {
      component = this;
      Object.assign(this, injections);
    }
  }

  let app = buildApp('test-app')
    .template('main', '<hello-world></hello-world>')
    .template('hello-world', '<div>Hello world</div>')
    .component('hello-world', Component)
    .boot()

  assert.ok(component, 'component exists');
  assert.strictEqual(getOwner(component), app, 'owner has been set');
});