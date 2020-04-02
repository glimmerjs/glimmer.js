import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { on, action } from '@glimmer/modifier';

import {
  setComponentTemplate,
  createTemplate,
  templateOnlyComponent,
  getOwner,
} from '@glimmer/core';

import { module, test, render } from '../utils';
import { DEBUG } from '@glimmer/env';

module(`[@glimmer/core] non-interactive rendering tests`, () => {
  test('it renders a component', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(MyComponent, createTemplate(`<h1>Hello world</h1>`));

    const html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Hello world</h1>', 'the template was rendered');
    assert.ok(true, 'rendered');
  });

  test('a component can render a nested component', async (assert) => {
    class OtherComponent extends Component {}

    setComponentTemplate(OtherComponent, createTemplate(`Hello world`));

    class MyComponent extends Component {}
    setComponentTemplate(
      MyComponent,
      createTemplate({ OtherComponent }, `<h1><OtherComponent /></h1>`)
    );

    const html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Hello world</h1>', 'the template was rendered');
    assert.ok(true, 'rendered');
  });

  test('a component can render multiple nested components', async (assert) => {
    class Foo extends Component {}
    setComponentTemplate(Foo, createTemplate(`Foo`));

    class Bar extends Component {}
    setComponentTemplate(Bar, createTemplate(`Bar`));

    class OtherComponent extends Component {}
    setComponentTemplate(
      OtherComponent,
      createTemplate({ Foo, Bar }, `Hello world <Foo /><Bar />`)
    );

    class MyComponent extends Component {}
    setComponentTemplate(
      MyComponent,
      createTemplate({ OtherComponent }, `<h1><OtherComponent /></h1>`)
    );

    const html = await render(MyComponent);

    assert.strictEqual(html, '<h1>Hello world FooBar</h1>', 'the template was rendered');
  });

  test('custom elements are rendered', async function (assert) {
    const component = templateOnlyComponent();

    setComponentTemplate(component, createTemplate('<hello-world>foo</hello-world>'));

    assert.equal(await render(component), '<hello-world>foo</hello-world>');
  });

  test('a component can render with args', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(MyComponent, createTemplate('<h1>{{@say}}</h1>'));

    const renderOptions = {
      args: {
        say: 'Hello Dolly!',
      },
    };

    const html = await render(MyComponent, renderOptions);
    assert.strictEqual(
      html,
      '<h1>Hello Dolly!</h1>',
      'the component is rendered with passed in args'
    );
  });

  test('can use block params', async function (assert) {
    class MainComponent extends Component {
      salutation = 'Glimmer';
    }

    const HelloWorld = templateOnlyComponent();

    setComponentTemplate(HelloWorld, createTemplate('{{yield @name}}!'));

    setComponentTemplate(
      MainComponent,
      createTemplate(
        { HelloWorld },
        '<HelloWorld @name={{this.salutation}} as |name|>{{name}}</HelloWorld>'
      )
    );

    assert.equal(await render(MainComponent), 'Glimmer!');
  });

  [true, false].forEach((pred) => {
    test(`can use inline if - ${pred}`, async function (assert) {
      let salutationCount = 0;
      let alternativeCount = 0;

      class Main extends Component {
        pred = pred;

        get salutation(): string {
          salutationCount++;
          return 'Glimmer';
        }

        get alternative(): string {
          alternativeCount++;
          return 'Glimmer.js';
        }
      }

      setComponentTemplate(
        Main,
        createTemplate('Hello {{if this.pred this.salutation this.alternative}}!')
      );

      assert.equal(
        await render(Main),
        `Hello ${pred ? 'Glimmer' : 'Glimmer.js'}!`,
        'output is correct'
      );

      assert.equal(pred ? salutationCount : alternativeCount, 1, 'chosen branch value was used');
      assert.equal(
        pred ? alternativeCount : salutationCount,
        0,
        'non-chosen branch value was not used'
      );
    });
  });

  test('inline if cannot be overwritten', async function (assert) {
    class Main extends Component {
      pred = true;
      salutation = 'Glimmer';
      alternative = 'Glimmer.js';
    }

    setComponentTemplate(
      Main,
      createTemplate(
        { if: () => assert.ok(false, 'custom if was called') },
        'Hello {{if this.pred this.salutation this.alternative}}!'
      )
    );

    assert.equal(await render(Main), 'Hello Glimmer!', 'output is correct');
  });

  // test('can render a component with the component helper', async function(assert) {
  //   const HelloWorld = templateOnlyComponent();

  //   setComponentTemplate(HelloWorld, createTemplate('<h1>Hello {{@name}}!</h1>'));

  //   class MainComponent extends Component {
  //     salutation = 'Glimmer';
  //     HelloWorld = HelloWorld;
  //   }

  //   setComponentTemplate(MainComponent, createTemplate('{{component this.HelloWorld name=salutation}}'));

  //   assert.equal(await render(MainComponent), 'Hello Glimmer!');
  // });

  test('components receive owner', async (assert) => {
    class Owner {
      services = {
        locale: new LocaleService(),
      };
    }

    class LocaleService {
      get currentLocale(): string {
        return 'en_US';
      }
    }

    class MyComponent extends Component {
      get myLocale(): string {
        return getOwner<Owner>(this).services.locale.currentLocale;
      }
    }

    setComponentTemplate(MyComponent, createTemplate('<h1>{{this.myLocale}}</h1>'));

    const html = await render(MyComponent, {
      owner: new Owner(),
    });

    assert.strictEqual(html, '<h1>en_US</h1>');
  });

  test('a component can be rendered more than once', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(MyComponent, createTemplate(`<h1>Bump</h1>`));

    let html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Bump</h1>', 'the component rendered');
    assert.ok(true, 'rendered');

    html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Bump</h1>', 'the component was rendered again');
    assert.ok(true, 'rendered');
  });

  test('a component can use modifiers', async (assert) => {
    class MyComponent extends Component {
      @tracked count = 0;

      @action
      incrementCounter(): void {
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

    const html = await render(MyComponent);
    assert.strictEqual(html, `<button>Count: 0</button>`, 'the component was rendered');
  });

  test('it can set a dynamic href on an anchor', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(MyComponent, createTemplate(`<a href={{@href}}>Link</a>`));

    const html = await render(MyComponent, { args: { href: 'www.example.com' } });
    assert.strictEqual(html, '<a href="www.example.com">Link</a>', 'the template was rendered');
  });

  test('it can set a dynamic src on an img', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(MyComponent, createTemplate(`<img src={{@src}}/>`));

    const html = await render(MyComponent, { args: { src: './logo.svg' } });
    assert.strictEqual(html, '<img src="./logo.svg">', 'the template was rendered');
  });

  if (DEBUG) {
    test('accessing properties in template-only components produces a helpful error in development mode', async function (assert) {
      assert.expect(1);

      const component = templateOnlyComponent();
      setComponentTemplate(component, createTemplate('<h1>Hello, {{this.name}}!</h1>'));

      try {
        await render(component);
      } catch (err) {
        assert.ok(
          err.message.match(
            "You tried to reference {{name}} from the template-only-component template, which doesn't have an associated component class. Template-only components can only access args passed to them. Did you mean {{@name}}?"
          )
        );
      }
    });
  } else {
    test('accessing properties in template-only components produces an exception in production mode', async function (assert) {
      assert.expect(1);

      const component = templateOnlyComponent();
      setComponentTemplate(component, createTemplate('<h1>Hello, {{this.name}}!</h1>'));

      try {
        await render(component);
      } catch (err) {
        assert.ok(err instanceof TypeError);
      }
    });
  }
});
