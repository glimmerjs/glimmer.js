import Component from '@glimmer/component';
import { buildApp } from '@glimmer/application-test-helpers';
import { getOwner } from '@glimmer/di';
import { expect } from '@glimmer/util';

const { module, test } = QUnit;

module('[@glimmer/component] Component');

test('can be instantiated with an owner', async function(assert) {
  let _component: MyComponent;

  class MyComponent extends Component {
    constructor(injections: any) {
      super(injections);
      _component = this;
    }
  }

  let app = await buildApp({ appName: 'test-app' })
    .template('Main', '<div><HelloWorld></HelloWorld></div>')
    .template('HelloWorld', '<div>Hello world</div>')
    .component('HelloWorld', MyComponent)
    .boot();

  let component = expect(_component!, `Expected MyComponent to be called by now`);

  assert.ok(component, 'component exists');
  assert.strictEqual(getOwner(component), app, 'owner has been set');
});
