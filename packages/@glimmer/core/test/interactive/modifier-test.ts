import { test, render, settled, tracked } from '../utils';
import { click } from '../utils/dom';
import { on, action } from '@glimmer/modifier';
import Component from '@glimmer/component';
import { setComponentTemplate, precompileTemplate } from '@glimmer/core';

QUnit.module('Modifier Tests', () => {
  test('Supports the on modifier', async (assert) => {
    const args = tracked({ count: 0 });

    class MyComponent extends Component {
      @action
      incrementCounter(): void {
        args.count++;
      }
    }

    setComponentTemplate(
      precompileTemplate(
        { on },
        `<button {{on "click" this.incrementCounter}}>Count: {{@count}}</button>`
      ),
      MyComponent
    );

    assert.strictEqual(
      await render(MyComponent, { args }),
      `<button>Count: 0</button>`,
      'the component was rendered'
    );

    click('button');

    assert.strictEqual(
      await settled(),
      `<button>Count: 1</button>`,
      'the component was rerendered'
    );
  });
});
