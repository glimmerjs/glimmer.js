const { module, test } = QUnit;

import { on, action } from '@glimmerx/modifier';
import Component, { tracked } from '@glimmerx/component';
import { renderComponent, setComponentTemplate, didRender } from '..';
import { compileTemplate } from './utils';

module('Modifier Tests', () => {
  test('Supports the on modifier', async assert => {
    class MyComponent extends Component {
      @tracked count = 0;

      @action
      incrementCounter() {
        this.count++;
      }
    }

    setComponentTemplate(
      MyComponent,
      compileTemplate(
        `<button {{on "click" this.incrementCounter}}>Count: {{this.count}}</button>`,
        () => ({ on })
      )
    );

    const element = document.getElementById('qunit-fixture')!;

    await renderComponent(MyComponent, element);
    assert.strictEqual(
      element.innerHTML,
      `<button>Count: 0</button>`,
      'the component was rendered'
    );

    const button = element.querySelector('button')!;
    button.click();

    await didRender();
    assert.strictEqual(
      element.innerHTML,
      `<button>Count: 1</button>`,
      'the component was rerendered'
    );
  });
});
