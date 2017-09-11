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
      assert.ok(this.element instanceof Element);
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
