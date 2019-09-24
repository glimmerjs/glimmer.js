import Component from '@glimmer/component';
import { buildApp, didRender } from '@glimmer/application-test-helpers';
import { tracked, setPropertyDidChange } from '@glimmer/tracking';

const { module, test } = QUnit;

module('[@glimmer/component] Lifecycle Hooks');

test('Lifecycle hook ordering', async function(assert) {
  assert.expect(1);

  let invocations: [string, string][] = [];
  let component1: Component1;

  abstract class HookLoggerComponent extends Component {
    args: {
      name: string
    };

    constructor(owner, args) {
      super(owner, args);
      invocations.push([this.args.name, 'constructor']);
    }

    didInsertElement() {
      invocations.push([this.args.name, 'didInsertElement']);
    }

    didUpdate() {
      invocations.push([this.args.name, 'didUpdate']);
    }
  }

  class Component1 extends HookLoggerComponent {
    @tracked firstName = 'Chirag';
    constructor(owner, args) {
      super(owner, args);
      component1 = this;
    }
  }
  class Component2 extends HookLoggerComponent {}
  class Component3 extends HookLoggerComponent {}
  class Component4 extends HookLoggerComponent {}
  class Component5 extends HookLoggerComponent {}

  const app = await buildApp()
    .template('Main', '<div><ComponentOne @name="component1"/></div>')
    .template(
      'ComponentOne',
      '<div><ComponentTwo @name="component2" @firstName={{this.firstName}} /><ComponentThree @name="component3"/></div>'
    )
    .template(
      'ComponentTwo',
      '<div>{{@firstName}}<ComponentFour @name="component4"/><ComponentFive @name="component5"/></div>'
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

  setPropertyDidChange(() => {
    app.scheduleRerender();
  });

  component1.firstName = 'Test';

  await didRender(app);

  assert.deepEqual(invocations, [
    ['component1', 'constructor'],
    ['component2', 'constructor'],
    ['component4', 'constructor'],
    ['component5', 'constructor'],
    ['component3', 'constructor'],
    ['component4', 'didInsertElement'],
    ['component5', 'didInsertElement'],
    ['component2', 'didInsertElement'],
    ['component3', 'didInsertElement'],
    ['component1', 'didInsertElement'],
    ['component2', 'didUpdate'],
    ['component1', 'didUpdate'],
  ]);
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
