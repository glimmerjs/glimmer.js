import Component from '@glimmer/component';
import { buildApp } from '@glimmer/application-test-helpers';
import { getOwner } from '@glimmer/di';

const { module, test } = QUnit;

module('[@glimmer/component] Component');

test('can be instantiated with an owner', async function(assert) {
  let component: MyComponent;

  class MyComponent extends Component {
    constructor(injections: any) {
      super(injections);
      component = this;
    }
  }

  let app = await buildApp({ appName: 'test-app' })
    .template('Main', '<div><HelloWorld></HelloWorld></div>')
    .template('HelloWorld', '<div>Hello world</div>')
    .component('HelloWorld', MyComponent)
    .boot();

  assert.ok(component, 'component exists');
  assert.strictEqual(getOwner(component), app, 'owner has been set');
});

test('can yield named args to the block', async function(assert) {
  let app = await buildApp()
    .helper('hash', (params: any, named: string) => named)
    .template('Main', '<YieldsHash as |x|>I have {{x.number}} {{x.string}}</YieldsHash>')
    .template('YieldsHash', '<div>{{yield (hash string="bananas" number=5)}}</div>')
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'I have 5 bananas');
});
