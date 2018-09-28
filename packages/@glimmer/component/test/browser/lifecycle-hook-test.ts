import Component from '@glimmer/component';
import { buildApp } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Lifecycle Hooks');

test('Lifecycle hook ordering', async function(assert) {
  assert.expect(7);

  let invocations: [string, string][] = [];
  let didCallWillDestroy = false;

  abstract class HookLoggerComponent extends Component {
    abstract name: string;

    didInsertElement() {
      invocations.push([this.name, 'didInsertElement']);
      assert.ok(this.bounds.firstNode instanceof Element);
    }

    willDestroy() {
      didCallWillDestroy = true;
    }
  }

  class Component1 extends HookLoggerComponent { name = 'component1'; };
  class Component2 extends HookLoggerComponent { name = 'component2'; };
  class Component3 extends HookLoggerComponent { name = 'component3'; };
  class Component4 extends HookLoggerComponent { name = 'component4'; };
  class Component5 extends HookLoggerComponent { name = 'component5'; };

  let app = await buildApp()
    .template('Main', '<div><ComponentOne /></div>')
    .template('ComponentOne', '<div><ComponentTwo /><ComponentThree /></div>')
    .template('ComponentTwo', '<div><ComponentFour /><ComponentFive /></div>')
    .template('ComponentThree', '<div></div>')
    .template('ComponentFour', '<div></div>')
    .template('ComponentFive', '<div></div>')
    .component('ComponentOne', Component1)
    .component('ComponentTwo', Component2)
    .component('ComponentThree', Component3)
    .component('ComponentFour', Component4)
    .component('ComponentFive', Component5)
    .boot();

  assert.deepEqual(invocations, [
    ['component4', 'didInsertElement'],
    ['component5', 'didInsertElement'],
    ['component2', 'didInsertElement'],
    ['component3', 'didInsertElement'],
    ['component1', 'didInsertElement'],
  ]);

  let component1 = app["_container"].lookup("component:/test-app/components/ComponentTwo");
  component1.destroy();

  assert.ok(didCallWillDestroy);
});

test('element is set before didInsertElement', async function(assert) {
  assert.expect(1);

  class Element extends Component {
    didInsertElement() {
      assert.equal(this.element.tagName, 'H1');
    }
  }

  await buildApp()
    .component('Element', Element)
    .template('Main', '<Element />')
    .template('Element', trim(`
      <h1>Chad Hietala - Greatest thinker of our generation</h1>
     `)).boot();
});

test('fragment bounds are set before didInsertElement', async function(assert) {
  assert.expect(2);

  class Fragment extends Component {
    didInsertElement() {
      assert.equal(this.bounds.firstNode.nodeName, '#text', 'firstNode should be a text node');
      assert.equal(this.bounds.lastNode.textContent, 'Greatest thinker of our generation', 'last node should be a span');
    }
  }

  await buildApp()
    .component('Fragment', Fragment)
    .template('Main', '<Fragment />')
    .template('Fragment', trim(`
      Hello world!
      <h1>Chad Hietala</h1>
      <span>Greatest thinker of our generation</span>
     `)).boot();
});

function trim(str: string) {
  return str.trim();
}
