import Component from '@glimmer/component';

import { module, test, render } from '../utils';
import { setComponentTemplate, createTemplate } from '@glimmer/core';

function freeze<T>(array: T[]): ReadonlyArray<Readonly<T>> {
  return Object.freeze(array.slice().map<T>(Object.freeze));
}

class HelloWorld extends Component {
  numbers = [1, 2, 3];
  frozenNumbers = freeze(this.numbers);

  strings = ['Toran', 'Robert', 'Jesper'];
  frozenStrings = freeze(this.strings);

  objects = this.strings.map((name) => ({ name }));
  frozenObjects = freeze(this.objects);
}

module('[@glimmer/core] each helper', () => {
  test('throw error if unknown special key used as key for #each', function (assert) {
    const Component = class extends HelloWorld {};

    setComponentTemplate(
      Component,
      createTemplate(
        `<ul>{{#each this.strings key="@unknown" as |item|}}<li>{{item}}</li>{{/each}}</ul>`
      )
    );

    assert.rejects(render(Component), /Error: invalid keypath/);
  });

  test(`renders number literals - numbers`, async function (assert) {
    assert.expect(1);

    const Component = class extends HelloWorld {};

    setComponentTemplate(
      Component,
      createTemplate(
        `<ul>{{#each this.numbers key="@index" as |item|}}<li>{{item}}</li>{{/each}}</ul>`
      )
    );

    assert.equal(await render(Component), '<ul><li>1</li><li>2</li><li>3</li></ul>');
  });

  test(`renders number literals - frozen numbers`, async function (assert) {
    assert.expect(1);

    const Component = class extends HelloWorld {};

    setComponentTemplate(
      Component,
      createTemplate(
        `<ul>{{#each this.frozenNumbers key="@index" as |item|}}<li>{{item}}</li>{{/each}}</ul>`
      )
    );

    assert.equal(await render(Component), '<ul><li>1</li><li>2</li><li>3</li></ul>');
  });

  test(`renders string literals - strings`, async function (assert) {
    assert.expect(1);

    const Component = class extends HelloWorld {};

    setComponentTemplate(
      Component,
      createTemplate(
        `<ul>{{#each this.strings key="@index" as |item|}}<li>{{item}}</li>{{/each}}</ul>`
      )
    );

    assert.equal(await render(Component), '<ul><li>Toran</li><li>Robert</li><li>Jesper</li></ul>');
  });

  test(`renders string literals - frozenStrings`, async function (assert) {
    assert.expect(1);

    const Component = class extends HelloWorld {};

    setComponentTemplate(
      Component,
      createTemplate(
        `<ul>{{#each this.frozenStrings key="@index" as |item|}}<li>{{item}}</li>{{/each}}</ul>`
      )
    );

    assert.equal(await render(Component), '<ul><li>Toran</li><li>Robert</li><li>Jesper</li></ul>');
  });

  test(`renders objects - objects`, async function (assert) {
    assert.expect(1);

    const Component = class extends HelloWorld {};

    setComponentTemplate(
      Component,
      createTemplate(
        `<ul>{{#each this.objects key="@index" as |item|}}<li>{{item.name}}</li>{{/each}}</ul>`
      )
    );

    assert.equal(await render(Component), '<ul><li>Toran</li><li>Robert</li><li>Jesper</li></ul>');
  });

  test(`renders objects - frozenObjects`, async function (assert) {
    assert.expect(1);

    const Component = class extends HelloWorld {};

    setComponentTemplate(
      Component,
      createTemplate(
        `<ul>{{#each this.frozenObjects key="@index" as |item|}}<li>{{item.name}}</li>{{/each}}</ul>`
      )
    );

    assert.equal(await render(Component), '<ul><li>Toran</li><li>Robert</li><li>Jesper</li></ul>');
  });
});
