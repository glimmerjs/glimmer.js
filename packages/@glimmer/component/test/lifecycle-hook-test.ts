import Component from '..';
import { buildApp } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Lifecycle Hooks');

test('Lifecycle hook ordering', (assert) => {
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

  let app = buildApp()
    .template('Main', '<div><ComponentOne /></div>')
    .template('ComponentOne', '<div ...attributes><ComponentTwo /><ComponentThree /></div>')
    .template('ComponentTwo', '<div ...attributes><ComponentFour /><ComponentFive /></div>')
    .template('ComponentThree', '<div ...attributes></div>')
    .template('ComponentFour', '<div ...attributes></div>')
    .template('ComponentFive', '<div ...attributes></div>')
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

test('component element bounds are set', assert => {
  class BoundsComponent extends Component {
    didInsertElement() {
      assert.equal(this.bounds.firstNode.nodeName, '#text', 'firstNode should be a text node');
      assert.equal(this.bounds.lastNode.textContent, 'Greatest thinker of our generation', 'last node should be a span');
    }
  }

  buildApp()
    .component('BoundsComponent', BoundsComponent)
    .template('Main', '<BoundsComponent />')
    .template('BoundsComponent', trim(`
      Hello world!
      <h1>Chad Hietala</h1>
      <span>Greatest thinker of our generation</span>
     `)).boot();
});

test('component element is set to element with ...attributes', assert => {
  class SplatElementComponent extends Component {
    didInsertElement() {
      assert.equal(this.element.textContent, 'Chad Hietala', 'component element should be splatted h1');
      assert.equal(this.bounds.firstNode.nodeName, '#text', 'firstNode should be a text node');
      assert.equal(this.bounds.lastNode.textContent, 'Greatest thinker of our generation', 'last node should be a span');
    }
  }

  buildApp()
    .component('SplatElementComponent', SplatElementComponent)
    .template('Main', '<SplatElementComponent />')
    .template('SplatElementComponent', trim(`
      Hello world!
      <h1 ...attributes>Chad Hietala</h1>
      <span>Greatest thinker of our generation</span>
     `)).boot();

});

function trim(str) {
  return str.trim();
}
