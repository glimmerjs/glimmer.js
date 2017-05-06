import { getOwner, setOwner, Owner } from '@glimmer/di';
import { DOMTreeConstruction } from '@glimmer/runtime';
import Environment, { EnvironmentOptions } from '../src/environment';
import Component from '@glimmer/component';
import buildApp from './test-helpers/test-app';
import { didRender } from '@glimmer/application-test-helpers';
import SimpleDOM from 'simple-dom';

const { module, test } = QUnit;
const serializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);

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
  class MainComponent extends Component {
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

test('can render a component with the component helper', async function(assert) {
  class MainComponent extends Component {
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

  await didRender(app);

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('components without a template raise an error', function(assert) {
  class HelloWorldComponent extends Component {
    debugName: 'hello-world'
  }

  let app = buildApp()
    .template('main', '<div><hello-world /></div>')
    .component('hello-world', HelloWorldComponent);

  assert.raises(() => {
    app.boot();
  }, /The component 'hello-world' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory./);
});

test('can render a custom helper', async function(assert) {
  class MainComponent extends Component {
  }

  let app = buildApp()
    .helper('greeting', () => "Hello Glimmer!")
    .template('main', '<div>{{greeting}}</div>')
    .component('main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');

  app.scheduleRerender();
  
  await didRender(app);

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('can render a custom helper that takes args', async function(assert) {
  class MainComponent extends Component {
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
  
  await didRender(app);

  assert.equal(root.innerText, 'Hello Tom Dale!');
});

test('renders a component using simple-dom', function(assert) {
  assert.expect(1);

  let customDocument = new SimpleDOM.Document();

  let app = buildApp('test-app', { document: customDocument })
    .template('main', `<h1>Hello Glimmer!</h1>`)
    .boot();

  let serializedHTML = serializer.serialize(app.rootElement);

  assert.equal(serializedHTML, '<div><h1>Hello Glimmer!</h1></div>');
});
