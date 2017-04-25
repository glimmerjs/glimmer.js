import { getOwner, setOwner, Owner } from '@glimmer/di';
import { DOMTreeConstruction } from '@glimmer/runtime';

import Environment, { EnvironmentOptions } from '../src/environment';
import { TestComponent } from './test-helpers/components';
import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Environment');

test('can be instantiated with new', function(assert) {
  let env = new Environment({
    document: self.document,
    appendOperations: new DOMTreeConstruction(self.document)
  });
  assert.ok(env, 'environment exists');
});

test('can be instantiated with create', function(assert) {
  let env = Environment.create();
  assert.ok(env, 'environment exists');
});

test('can be assigned an owner', function(assert) {
  class FakeApp implements Owner {
    identify(specifier: string, referrer?: string) { return ''; }
    factoryFor(specifier: string, referrer?: string) { return null; }
    lookup(specifier: string, referrer?: string) { return null; }
  }
  let app = new FakeApp;

  let options: EnvironmentOptions = {};
  setOwner(options, app);

  let env = Environment.create(options);
  assert.strictEqual(getOwner(env), app, 'owner has been set');
});

test('can render a component', function(assert) {
  class MainComponent extends TestComponent {
    salutation = 'Glimmer';
  }

  let app = buildApp()
    .template('hello-world', `<h1>Hello {{@name}}!</h1>`)
    .component('main', MainComponent)
    .template('main', '<div><hello-world @name={{salutation}} /></div>')
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('can render a component with the component helper', function(assert) {
  class MainComponent extends TestComponent {
    salutation = 'Glimmer';
  }

  let app = buildApp()
    .template('hello-world', '<h1>Hello {{@name}}!</h1>')
    .template('main', '<div>{{component "hello-world" name=salutation}}</div>')
    .component('main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');

  app.scheduleRerender();

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('components without a template raise an error', function(assert) {
  class HelloWorldComponent extends TestComponent {
    debugName: 'hello-world'
  }

  let app = buildApp()
    .template('main', '<div><hello-world /></div>')
    .component('hello-world', HelloWorldComponent);

  assert.raises(() => {
    app.boot();
  }, /The component 'hello-world' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory./);
});

test('can render a custom helper', function(assert) {
  class MainComponent extends TestComponent {
  }

  let app = buildApp()
    .helper('greeting', () => "Hello Glimmer!")
    .template('main', '<div>{{greeting}}</div>')
    .component('main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');

  app.scheduleRerender();

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('can render a custom helper that takes args', function(assert) {
  class MainComponent extends TestComponent {
    firstName = 'Tom'
    lastName = 'Dale'
  }

  let app = buildApp()
    .helper('greeting', (params) => `Hello ${params[0]} ${params[1]}!`)
    .template('main', '<div>{{greeting firstName lastName}}</div>')
    .component('main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Tom Dale!');

  app.scheduleRerender();

  assert.equal(root.innerText, 'Hello Tom Dale!');
});

