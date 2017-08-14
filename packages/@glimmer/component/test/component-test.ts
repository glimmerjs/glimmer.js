import Component from '../src/index';
import buildApp from './test-helpers/test-app';
import { getOwner } from '@glimmer/di';

const { module, test } = QUnit;

module('Component');

test('can be instantiated with an owner', function(assert) {
  let component: MyComponent;

  class MyComponent extends Component {
    element: Element;

    constructor(injections: any) {
      super(injections);
      component = this;
    }
  }

  let app = buildApp('test-app')
    .template('main', '<div><hello-world></hello-world></div>')
    .template('hello-world', '<div>Hello world</div>')
    .component('hello-world', MyComponent)
    .boot();

  assert.ok(component, 'component exists');
  assert.strictEqual(getOwner(component), app, 'owner has been set');
});
