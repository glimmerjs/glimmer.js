import Component from '..';
import { buildApp } from '@glimmer/application-test-helpers';
import { getOwner } from '@glimmer/di';

const { module, test } = QUnit;

module('[@glimmer/component] Component');

test('can be instantiated with an owner', function(assert) {
  let component: MyComponent;

  class MyComponent extends Component {
    constructor(injections: any) {
      super(injections);
      component = this;
    }
  }

  let app = buildApp('test-app')
    .template('Main', '<div><HelloWorld></HelloWorld></div>')
    .template('HelloWorld', '<div>Hello world</div>')
    .component('HelloWorld', MyComponent)
    .boot();

  assert.ok(component, 'component exists');
  assert.strictEqual(getOwner(component), app, 'owner has been set');
});
