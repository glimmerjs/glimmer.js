import Component, { tracked } from '@glimmer/component';
import { buildApp, didRender } from '@glimmer/application-test-helpers';
import { debugInfoForReference } from '@glimmer/application';

const { module, test } = QUnit;

module('[@glimmer/application] Actions');

test('can curry arguments to actions', async function(assert) {
  assert.expect(9);

  let fakeEvent: any = {};
  let helloWorldComponent: HelloWorld;
  let passedMsg1, passedMsg2, passedEvent;

  class HelloWorld extends Component {
    @tracked
    name = "world";

    constructor(injections: object) {
      super(injections);
      helloWorldComponent = this;
    }

    userDidClick(msg1, msg2, event) {
      passedMsg1 = msg1;
      passedMsg2 = msg2;
      passedEvent = event;
      assert.strictEqual(this, helloWorldComponent, 'function context is preserved');
    }
  }

  let app = await buildApp()
    .template('HelloWorld', '<h1 onclick={{action userDidClick "hello" name}}>Hello World</h1>')
    .template('Main', '<div><HelloWorld /></div>')
    .component('HelloWorld', HelloWorld)
    .boot();

  let root = app.rootElement as HTMLElement;
  assert.strictEqual(root.innerText, 'Hello World');

  let h1 = root.querySelector('h1');
  h1.onclick(fakeEvent);

  assert.strictEqual(passedMsg1, 'hello');
  assert.strictEqual(passedMsg2, 'world');
  assert.strictEqual(passedEvent, fakeEvent);
  passedEvent = null;

  helloWorldComponent.name = "cruel world";
  app.scheduleRerender();

  await didRender(app);

  h1 = root.querySelector('h1');
  h1.onclick(fakeEvent);

  assert.strictEqual(passedMsg1, 'hello');
  assert.strictEqual(passedMsg2, 'cruel world');
  assert.strictEqual(passedEvent, fakeEvent);
});

test('actions can be passed and invoked with additional arguments', async function(assert) {
  assert.expect(2);

  let fakeEvent: any = {
    type: 'click'
  };
  let parentComponent: ParentComponent;
  let passed = [];

  class ParentComponent extends Component {
    name = "world";

    constructor(injections: object) {
      super(injections);
      parentComponent = this;
    }

    userDidClick(a1, a2, a3, a4, a5, a6, evt) {
      passed = [a1, a2, a3, a4, a5, a6, evt];
      assert.strictEqual(this, parentComponent, 'function context is preserved');
    }
  }

  let app = await buildApp()
    .template('Main', '<div><Parent /></div>')
    .template('Parent', '<div><Child @userDidClick={{action userDidClick 1 2}} /></div>')
    .component('Parent', ParentComponent)
    .template('Child', '<div><Grandchild @userDidClick={{action @userDidClick 3 4}} /></div>')
    .template('Grandchild', '<div class="grandchild" onclick={{action @userDidClick 5 6}}></div>')
    .boot();

  let root = app.rootElement as Element;

  let h1 = root.querySelector('.grandchild') as HTMLElement;
  h1.onclick(fakeEvent);

  assert.deepEqual(passed, [1, 2, 3, 4, 5, 6, fakeEvent]);
});

test('action helper invoked without a function raises an error', async function(assert) {
  class ParentComponent extends Component {
    debugName = 'ParentComponent';
  }

  let app = await buildApp()
    .template('Main', '<div><Parent /></div>')
    .template('Parent', '<div><span onclick={{action doesntExist}}></span></div>')
    .component('Parent', ParentComponent);

  try {
    await app.boot();
  } catch (e) {
    assert.equal(e.message, "You tried to create an action with the \{\{action\}\} helper, but the first argument \('doesntExist' on ParentComponent\) was undefined instead of a function.");
  }
});

test('debug name from references can be extracted', function(assert) {
  let refOne = {
    parent: {
      value() { return { debugName: 'parent' }; }
    },
    property: 'name'
  };

  let refTwo = {
    _parentValue: {
      debugName: 'contact'
    },
    _propertyKey: 'address'
  };

  assert.strictEqual(debugInfoForReference(null), '');
  assert.strictEqual(debugInfoForReference(refOne), `('name' on parent) `);
  assert.strictEqual(debugInfoForReference(refTwo), `('address' on contact) `);
});
