import Component from '@glimmer/component';
import { buildApp } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Lifecycle Hooks');

test('Lifecycle hook ordering', async function(assert) {
  assert.expect(1);

  let invocations: [string, string][] = [];

  abstract class HookLoggerComponent extends Component {
    constructor(owner, args) {
      super(owner, args);
      invocations.push([this.args.name, 'constructor']);
    }
  }

  class Component1 extends HookLoggerComponent {}
  class Component2 extends HookLoggerComponent {}
  class Component3 extends HookLoggerComponent {}
  class Component4 extends HookLoggerComponent {}
  class Component5 extends HookLoggerComponent {}

  await buildApp()
    .template('Main', '<div><ComponentOne @name="component1"/></div>')
    .template(
      'ComponentOne',
      '<div><ComponentTwo @name="component2"/><ComponentThree @name="component3"/></div>'
    )
    .template(
      'ComponentTwo',
      '<div><ComponentFour @name="component4"/><ComponentFive @name="component5"/></div>'
    )
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
    ['component1', 'constructor'],
    ['component2', 'constructor'],
    ['component4', 'constructor'],
    ['component5', 'constructor'],
    ['component3', 'constructor'],
  ]);
});
