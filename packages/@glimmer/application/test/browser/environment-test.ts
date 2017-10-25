import { DOMTreeConstruction } from '@glimmer/runtime';
import { Environment } from '@glimmer/application';
import Component from '@glimmer/component';
import { buildApp, didRender } from '@glimmer/application-test-helpers';
import * as SimpleDOM from 'simple-dom';

const { module, test } = QUnit;
const serializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);

module('[@glimmer/application] Environment');

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

test('can render a component', async function(assert) {
  class MainComponent extends Component {
    salutation = 'Glimmer';
  }

  let app = await buildApp()
  .component('Main', MainComponent)
  .template('Main', '<div><HelloWorld @name={{salutation}} /></div>')
  .template('HelloWorld', `<h1>Hello {{@name}}!</h1>`)
  .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('can render a component with the component helper', async function(assert) {
  class MainComponent extends Component {
    salutation = 'Glimmer';
  }

  let app = await buildApp()
    .template('HelloWorld', '<h1>Hello {{@name}}!</h1>')
    .template('Main', '<div>{{component "HelloWorld" name=salutation}}</div>')
    .component('Main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');

  app.scheduleRerender();

  await didRender(app);

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('can use block params', async function(assert) {
  class MainComponent extends Component {
    salutation = 'Glimmer';
  }

  let app = await buildApp()
    .template('HelloWorld', '{{yield @name}}!')
    .template('Main', '<div><HelloWorld @name={{salutation}} as |name|>{{name}}</HelloWorld></div>')
    .component('Main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Glimmer!');

  app.scheduleRerender();

  await didRender(app);

  assert.equal(root.innerText, 'Glimmer!');
});

test('can use inline if', async function(assert) {
  class MainComponent extends Component {
    salutation = 'Glimmer';
    pred = true;
    alternative = false;
  }

  let app = await buildApp()
    .template('HelloWorld', '<h1>Hello {{@name}}!</h1>')
    .template('Main', '<div><HelloWorld @name={{if pred salutation alternative}} /></div>')
    .component('Main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');

  app.scheduleRerender();

  await didRender(app);

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('custom elements are rendered', async function(assert) {
  let app = await buildApp()
    .template('Main', '<hello-world>foo</hello-world>')
    .boot();

  let serializedHTML = serializer.serialize(app.rootElement);

  assert.equal(serializedHTML, '<div><hello-world>foo</hello-world></div>');
});

test('components without a template raise an error', async function(assert) {
  class HelloWorldComponent extends Component {
    debugName: 'HelloWorld';
  }

  let app = buildApp()
    .template('Main', '<div><HelloWorld /></div>')
    .component('HelloWorld', HelloWorldComponent);

  await assert.rejects(app.boot(), /The component 'HelloWorld' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory./);
});

test('components with dasherized names raise an error', function(assert) {
  class HelloWorldComponent extends Component {
    debugName: 'hello-world';
  }

  assert.throws(() => {
    buildApp()
    .template('hello-world', '<div><hello-world /></div>')
    .component('hello-world', HelloWorldComponent);
  }, Error("template names must start with a capital letter"));
});

test('can render a custom helper', async function(assert) {
  class MainComponent extends Component {
  }

  let app = await buildApp()
    .helper('greeting', () => "Hello Glimmer!")
    .template('Main', '<div>{{greeting}}</div>')
    .component('Main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Glimmer!');

  app.scheduleRerender();
  await didRender(app);

  assert.equal(root.innerText, 'Hello Glimmer!');
});

test('can render a custom helper that takes args', async function(assert) {
  class MainComponent extends Component {
    firstName = 'Tom';
    lastName = 'Dale';
  }

  let app = await buildApp()
    .helper('greeting', (params) => `Hello ${params[0]} ${params[1]}!`)
    .template('Main', '<div>{{greeting firstName lastName}}</div>')
    .component('Main', MainComponent)
    .boot();

  let root = app.rootElement as HTMLElement;

  assert.equal(root.innerText, 'Hello Tom Dale!');

  app.scheduleRerender();
  await didRender(app);

  assert.equal(root.innerText, 'Hello Tom Dale!');
});

test('renders a component using simple-dom', async function(assert) {
  assert.expect(1);

  let customDocument = new SimpleDOM.Document();

  let app = await buildApp({ document: customDocument })
    .template('Main', `<h1>Hello Glimmer!</h1>`)
    .boot();

  let serializedHTML = serializer.serialize(app.rootElement);

  assert.equal(serializedHTML, '<div><h1>Hello Glimmer!</h1></div>');
});
