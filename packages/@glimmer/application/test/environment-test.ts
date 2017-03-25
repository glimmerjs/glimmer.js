import { getOwner, setOwner, Owner, OWNER, Factory } from '@glimmer/di';
import { UpdatableReference } from '@glimmer/object-reference';
import { DOMTreeConstruction, templateFactory } from '@glimmer/runtime';
import Resolver, { ModuleRegistry } from '@glimmer/resolver';

import Environment, { EnvironmentOptions } from '../src/environment';
import DynamicScope from '../src/dynamic-scope';
import TemplateMeta from '../src/template-meta';
import { precompile } from './test-helpers/compiler';
import { TestComponentManager, TestComponent } from './test-helpers/components';
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

  assert.equal(app.rootElement.innerText, 'Hello Glimmer!');
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

  assert.equal(app.rootElement.innerText, 'Hello Glimmer!');

  app.rerender();

  assert.equal(app.rootElement.innerText, 'Hello Glimmer!');
});
