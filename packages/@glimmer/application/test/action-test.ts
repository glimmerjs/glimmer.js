import { TestComponent } from './test-helpers/components';
import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Actions');

test('can curry arguments to actions', function(assert) {
  assert.expect(9);

  let fakeEvent: any = {};
  let helloWorldComponent: HelloWorld;
  let passedMsg1, passedMsg2, passedEvent;

  class HelloWorld extends TestComponent {
    name = "world";

    constructor() {
      super();
      helloWorldComponent = this;
    }

    userDidClick(msg1, msg2, event) {
      passedMsg1 = msg1;
      passedMsg2 = msg2;
      passedEvent = event;
      assert.strictEqual(this, helloWorldComponent, 'function context is preserved');
    }
  }

  let app = buildApp()
    .template('hello-world', '<h1 onclick={{action userDidClick "hello" name}}>Hello World</h1>')
    .template('main', '<div><hello-world /></div>')
    .component('hello-world', HelloWorld)
    .boot();

  assert.strictEqual(app.rootElement.innerText, 'Hello World');

  let h1 = app.rootElement.querySelector('h1');
  h1.onclick(fakeEvent);

  assert.strictEqual(passedMsg1, 'hello');
  assert.strictEqual(passedMsg2, 'world');
  assert.strictEqual(passedEvent, fakeEvent);
  passedEvent = null;

  helloWorldComponent.name = "cruel world";
  app.rerender();

  h1 = app.rootElement.querySelector('h1');
  h1.onclick(fakeEvent);

  assert.strictEqual(passedMsg1, 'hello');
  assert.strictEqual(passedMsg2, 'cruel world');
  assert.strictEqual(passedEvent, fakeEvent);
});

test('actions can be passed and invoked with additional arguments', function(assert) {
  let fakeEvent: any = {
    type: 'click'
  };
  let parentComponent: ParentComponent;
  let passed = [];

  class ParentComponent extends TestComponent {
    name = "world";

    constructor() {
      super();
      parentComponent = this;
    }

    userDidClick() {
      passed = [...arguments];
      assert.strictEqual(this, parentComponent, 'function context is preserved');
    }
  }

  let app = buildApp()
    .template('main', '<div><parent-component /></div>')
    .template('parent-component', '<div><child-component @userDidClick={{action userDidClick 1 2}} /></div>')
    .template('child-component', '<div><grandchild-component @userDidClick={{action @userDidClick 3 4}} /></div>')
    .template('grandchild-component', '<div class="grandchild" onclick={{action @userDidClick 5 6}}></div>')
    .component('parent-component', ParentComponent)
    .boot();

  let h1 = app.rootElement.querySelector('.grandchild') as HTMLElement;
  h1.onclick(fakeEvent);

  assert.deepEqual(passed, [1, 2, 3, 4, 5, 6, fakeEvent]);
});

test('action helper invoked without a function raises an error', function(assert) {
  class ParentComponent extends TestComponent {
    debugName = 'ParentComponent';
  }

  let app = buildApp()
    .template('main', '<div><parent-component /></div>')
    .template('parent-component', '<div><span onclick={{action doesntExist}}></span></div>')
    .component('parent-component', ParentComponent);

  assert.raises(() => {
    app.boot();
  }, /You tried to create an action with the \{\{action\}\} helper, but the first argument \(doesntExist on ParentComponent\) was undefined instead of a function./);
});
