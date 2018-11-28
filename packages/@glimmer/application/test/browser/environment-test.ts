import { Environment } from '@glimmer/application';
import Component from '@glimmer/component';
import { Simple } from '@glimmer/interfaces';
import { DOMTreeConstruction } from '@glimmer/runtime';
import { buildApp, didRender } from '@glimmer/application-test-helpers';
import { DEBUG } from '@glimmer/env';

import HTMLSerializer from '@simple-dom/serializer';
import voidMap from '@simple-dom/void-map';
import createHTMLDocument from '@simple-dom/document';

const { module, test } = QUnit;
const serializer = new HTMLSerializer(voidMap);

module('[@glimmer/application] Environment');

test('can be instantiated with new', function(assert) {
  let env = new Environment({
    document: self.document,
    appendOperations: new DOMTreeConstruction(self.document as Simple.Document)
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

  let app = await buildApp()
    .template('Main', '<div><HelloWorld /></div>')
    .component('HelloWorld', HelloWorldComponent);
  try {
    await app.boot();
  } catch (e) {
    assert.equal(e.message, "The component 'HelloWorld' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory.");
  }
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
    .helper('greeting', (params: string[]) => `Hello ${params[0]} ${params[1]}!`)
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

  let customDocument = createHTMLDocument();

  let app = await buildApp({ document: customDocument })
    .template('Main', `<h1>Hello Glimmer!</h1>`)
    .boot();

  let serializedHTML = serializer.serialize(app.rootElement);

  assert.equal(serializedHTML, '<div><h1>Hello Glimmer!</h1></div>');
});

if (DEBUG) {
  test('accessing properties in template-only components produces a helpful error in development mode', async function(assert) {
    assert.expect(1);

    try {
      await buildApp()
        .template('Main', '<h1>Hello, {{name}}!</h1>')
        .boot();
    } catch (err) {
      assert.ok(err.message.match("You tried to reference {{name}} from the Main template, which doesn't have an associated component class. Template-only components can only access args passed to them. Did you mean {{@name}}?"));
    }
  });
} else {
  test('accessing properties in template-only components produces an exception in production mode', async function(assert) {
    assert.expect(1);

    try {
      await buildApp()
        .template('Main', '<h1>Hello, {{name}}!</h1>')
        .boot();
    } catch (err) {
      assert.ok(err instanceof TypeError);
    }
  });
}
