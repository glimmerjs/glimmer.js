import { buildApp, didRender } from '@glimmer/application-test-helpers';
import Component from '@glimmer/component';

const { module, test } = QUnit;

module('[@glimmer/application] each helper');

function freeze<T>(array: T[]): ReadonlyArray<Readonly<T>> {
  return Object.freeze(array.slice().map(Object.freeze));
}

class HelloWorld extends Component {
  numbers = [1, 2, 3];
  frozenNumbers = freeze(this.numbers);
  strings = ["Toran", "Robert", "Jesper"];
  frozenStrings = freeze(this.strings);
  objects = this.strings.map(name => ({ name }));
  frozenObjects = freeze(this.objects);
}

['numbers', 'frozenNumbers'].forEach((kind: string) => {
  test(`renders number literals - ${kind}`, async function(assert) {
    assert.expect(1);

    let containerElement = document.createElement('div');

    let app = buildApp()
      .template('HelloWorld', `<ul>{{#each ${kind} key="@index" as |item|}}<li>{{item}}</li>{{/each}}</ul>`)
      .component('HelloWorld', HelloWorld)
      .boot();

    app.renderComponent('HelloWorld', containerElement);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<ul><li>1</li><li>2</li><li>3</li></ul>');
  });
});

['strings', 'frozenStrings'].forEach((kind: string) => {
  test(`renders string literals - ${kind}`, async function(assert) {
    assert.expect(1);

    let containerElement = document.createElement('div');

    let app = buildApp()
      .template('HelloWorld', `<ul>{{#each ${kind} key="@index" as |item|}}<li>{{item}}</li>{{/each}}</ul>`)
      .component('HelloWorld', HelloWorld)
      .boot();

    app.renderComponent('HelloWorld', containerElement);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<ul><li>Toran</li><li>Robert</li><li>Jesper</li></ul>');
  });
});

['objects', 'frozenObjects'].forEach((kind: string) => {
  test(`renders objects - ${kind}`, async function(assert) {
    assert.expect(1);

    let containerElement = document.createElement('div');

    let app = buildApp()
      .template('HelloWorld', `<ul>{{#each ${kind} key="@index" as |item|}}<li>{{item.name}}</li>{{/each}}</ul>`)
      .component('HelloWorld', HelloWorld)
      .boot();

    app.renderComponent('HelloWorld', containerElement);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<ul><li>Toran</li><li>Robert</li><li>Jesper</li></ul>');
  });
});