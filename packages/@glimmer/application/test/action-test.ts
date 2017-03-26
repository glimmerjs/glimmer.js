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
