import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { helper } from '@glimmer/helper';
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
  test('it renders a component', async assert => {
    class MyComponent extends Component {}

    setComponentTemplate(MyComponent, createTemplate(`<h1>Hello world</h1>`));

    const html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Hello world</h1>', 'the template was rendered');
    assert.ok(true, 'rendered');
  });

  test('a component can render a nested component', async assert => {
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

  test('a component can render multiple nested components', async assert => {
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

  test('custom elements are rendered', async function(assert) {
    const component = templateOnlyComponent();

    setComponentTemplate(component, createTemplate('<hello-world>foo</hello-world>'));

    assert.equal(await render(component), '<hello-world>foo</hello-world>');
  });

  test('a component can render with helpers', async assert => {
    const myHelper = helper(([name], { greeting }) => {
      return `helper ${greeting} ${name}`;
    });

    class MyComponent extends Component {}
    setComponentTemplate(
      MyComponent,
      createTemplate({ myHelper }, '<h1>{{myHelper "foo" greeting="Hello"}}</h1>')
    );

    const html = await render(MyComponent);
    assert.strictEqual(html, '<h1>helper Hello foo</h1>', 'the template was rendered');
  });

  test('a component can render with args', async assert => {
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

  test('can use block params', async function(assert) {
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

  // [true, false].forEach((pred) => {
  //   test(`can use inline if - ${pred}`, async function(assert) {
  //     class Main extends Component {
  //       pred = pred;
  //       salutation = 'Glimmer';
  //       alternative = 'Glimmer.js';
  //     }

  //     let HelloWorld = templateOnlyComponent();

  //     setComponentTemplate(HelloWorld, createTemplate('{{yield @name}}!'));

  //     setComponentTemplate(
  //       Main,
  //       createTemplate(
  //         { HelloWorld },
  //         '<HelloWorld @name={{if this.pred this.salutation this.alternative}} />'
  //       )
  //     );

  //     assert.equal(await render(Main), `Hello ${pred ? 'Glimmer' : 'Glimmer.js'}!`);
  //   });
  // });

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

  test('components receive owner', async assert => {
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

  // test('a helper can inject services', async assert => {
  //   class LocaleService {
  //     get currentLocale(): string {
  //       return 'en_US';
  //     }
  //   }

  //   const myHelper = helper((_args, _hash, { services }) => {
  //     const localeService = services!.locale as LocaleService;
  //     return `The locale is ${localeService.currentLocale}`;
  //   });

  //   class MyComponent extends Component {}
  //   setComponentTemplate(MyComponent, createTemplate({ myHelper }, '<h1>{{myHelper}}</h1>'));

  //   const html = await render(MyComponent, {
  //     meta: {
  //       locale: new LocaleService(),
  //     },
  //   });
  //   assert.strictEqual(html, '<h1>The locale is en_US</h1>');
  // });

  test('a component can be rendered more than once', async assert => {
    class MyComponent extends Component {}

    setComponentTemplate(MyComponent, createTemplate(`<h1>Bump</h1>`));

    let html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Bump</h1>', 'the component rendered');
    assert.ok(true, 'rendered');

    html = await render(MyComponent);
    assert.strictEqual(html, '<h1>Bump</h1>', 'the component was rendered again');
    assert.ok(true, 'rendered');
  });

  test('a component can use modifiers', async assert => {
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

  test('throws an exception if an invoked component is not found', async assert => {
    assert.expect(1);

    try {
      await render(createTemplate(`<NonExistent />`));
    } catch (err) {
      assert.ok(err.toString().match(/Cannot find component NonExistent in scope/));
    }
  });

  if (DEBUG) {
    test('accessing properties in template-only components produces a helpful error in development mode', async function(assert) {
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
    test('accessing properties in template-only components produces an exception in production mode', async function(assert) {
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
