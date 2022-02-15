import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { on, action } from '@glimmer/modifier';

import {
  setComponentTemplate,
  precompileTemplate,
  getOwner,
  templateOnlyComponent,
} from '@glimmer/core';

import { test, render } from '../utils';

QUnit.module(`[@glimmer/core] non-interactive rendering tests`, () => {
  test('it renders a component', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(
      precompileTemplate(`<h1>Hello world</h1>`, { strictMode: true }),
      MyComponent
    );

    const html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Hello world</h1>', 'the template was rendered');
    assert.ok(true, 'rendered');
  });

  test('a component can render a nested component', async (assert) => {
    class OtherComponent extends Component {}

    setComponentTemplate(precompileTemplate(`Hello world`, { strictMode: true }), OtherComponent);

    class MyComponent extends Component {}
    setComponentTemplate(
      precompileTemplate(`<h1><OtherComponent /></h1>`, {
        strictMode: true,
        scope: { OtherComponent },
      }),
      MyComponent
    );

    const html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Hello world</h1>', 'the template was rendered');
    assert.ok(true, 'rendered');
  });

  test('a component can render multiple nested components', async (assert) => {
    class Foo extends Component {}
    setComponentTemplate(precompileTemplate(`Foo`), Foo);

    class Bar extends Component {}
    setComponentTemplate(precompileTemplate(`Bar`), Bar);

    class OtherComponent extends Component {}
    setComponentTemplate(
      precompileTemplate(`Hello world <Foo /><Bar />`, { strictMode: true, scope: { Foo, Bar } }),
      OtherComponent
    );

    class MyComponent extends Component {}
    setComponentTemplate(
      precompileTemplate(`<h1><OtherComponent /></h1>`, {
        strictMode: true,
        scope: { OtherComponent },
      }),
      MyComponent
    );

    const html = await render(MyComponent);

    assert.strictEqual(html, '<h1>Hello world FooBar</h1>', 'the template was rendered');
  });

  test('custom elements are rendered', async function (assert) {
    const component = setComponentTemplate(
      precompileTemplate('<hello-world>foo</hello-world>'),
      templateOnlyComponent()
    );

    assert.equal(await render(component), '<hello-world>foo</hello-world>');
  });

  test('a component can render with args', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(
      precompileTemplate('<h1>{{@say}}</h1>', { strictMode: true }),
      MyComponent
    );

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

    const HelloWorld = setComponentTemplate(
      precompileTemplate('{{yield @name}}!'),
      templateOnlyComponent()
    );

    setComponentTemplate(
      precompileTemplate('<HelloWorld @name={{this.salutation}} as |name|>{{name}}</HelloWorld>', {
        strictMode: true,
        scope: { HelloWorld },
      }),
      MainComponent
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
        precompileTemplate('Hello {{if this.pred this.salutation this.alternative}}!', {
          strictMode: true,
        }),
        Main
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

  // test('can render a component with the component helper', async function(assert) {
  //   const HelloWorld = templateOnlyComponent();

  //   setComponentTemplate(HelloWorld, precompileTemplate('<h1>Hello {{@name}}!</h1>', { strictMode: true }));

  //   class MainComponent extends Component {
  //     salutation = 'Glimmer';
  //     HelloWorld = HelloWorld;
  //   }

  //   setComponentTemplate(MainComponent, precompileTemplate('{{component this.HelloWorld name=salutation}}', { strictMode: true }));

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
        return getOwner<Owner>(this)!.services.locale.currentLocale;
      }
    }

    setComponentTemplate(
      precompileTemplate('<h1>{{this.myLocale}}</h1>', { strictMode: true }),
      MyComponent
    );

    const html = await render(MyComponent, {
      owner: new Owner(),
    });

    assert.strictEqual(html, '<h1>en_US</h1>');
  });

  test('a component can be rendered more than once', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(precompileTemplate(`<h1>Bump</h1>`, { strictMode: true }), MyComponent);

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
      precompileTemplate(
        `<button {{on "click" this.incrementCounter}}>Count: {{this.count}}</button>`,
        { strictMode: true, scope: { on } }
      ),
      MyComponent
    );

    const html = await render(MyComponent);
    assert.strictEqual(html, `<button>Count: 0</button>`, 'the component was rendered');
  });

  test('it can set a dynamic href on an anchor', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(
      precompileTemplate(`<a href={{@href}}>Link</a>`, { strictMode: true }),
      MyComponent
    );

    const html = await render(MyComponent, { args: { href: 'www.example.com' } });
    assert.strictEqual(html, '<a href="www.example.com">Link</a>', 'the template was rendered');
  });

  test('it can set a dynamic src on an img', async (assert) => {
    class MyComponent extends Component {}

    setComponentTemplate(
      precompileTemplate(`<img src={{@src}}/>`, { strictMode: true }),
      MyComponent
    );

    const html = await render(MyComponent, { args: { src: './logo.svg' } });
    assert.strictEqual(html, '<img src="./logo.svg">', 'the template was rendered');
  });
});
