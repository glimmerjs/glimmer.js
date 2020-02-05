import { module, test, render, settled } from '../utils';

import { helper } from '@glimmer/helper';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate, createTemplate } from '@glimmer/core';

module('Modifier Tests', () => {
  test('helpers are not volatile', async assert => {
    let count = 0;

    const myHelper = helper(([name], { greeting }) => {
      count++;

      return `helper ${greeting} ${name}`;
    });

    let component: MyComponent;

    class MyComponent extends Component {
      constructor(owner: unknown, args: {}) {
        super(owner, args);
        component = this;
      }

      @tracked name = 'Rob';
      @tracked foo = 123;
    }

    setComponentTemplate(
      MyComponent,
      createTemplate({ myHelper }, '<h1>{{myHelper this.name greeting="Hello"}}</h1>')
    );

    let html = await render(MyComponent);

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');
    assert.equal(count, 1, 'helper rendered once');

    component!.foo = 456;

    html = await settled();

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');
    assert.equal(count, 1, 'helper did not rerender after unrelated change');

    component!.name = 'Tom';

    html = await settled();

    assert.strictEqual(html, '<h1>helper Hello Tom</h1>', 'the template was rendered');
    assert.equal(count, 2, 'helper reran after args changed');
  });
});
