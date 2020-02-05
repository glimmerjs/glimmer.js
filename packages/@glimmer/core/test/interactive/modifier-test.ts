import { module, test, render, settled } from '../utils';

import { on, action } from '@glimmer/modifier';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate, createTemplate } from '@glimmer/core';

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
      createTemplate(
        { on },
        `<button {{on "click" this.incrementCounter}}>Count: {{this.count}}</button>`
      )
    );

    const element = document.getElementById('qunit-fixture')!;

    await render(MyComponent, element);
    assert.strictEqual(
      element.innerHTML,
      `<button>Count: 0</button>`,
      'the component was rendered'
    );

    const button = element.querySelector('button')!;
    button.click();

    await settled();
    assert.strictEqual(
      element.innerHTML,
      `<button>Count: 1</button>`,
      'the component was rerendered'
    );
  });
});
