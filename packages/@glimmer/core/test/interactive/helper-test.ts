import { module, test, render, settled, tracked as trackedObj } from '../utils';

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  setComponentTemplate,
  createTemplate,
  getOwner,
  templateOnlyComponent,
} from '@glimmer/core';
import { helper } from '../utils/custom-helper';

module('[@glimmer/core] interactive - helper', () => {
  test('simple helpers update when args change', async (assert) => {
    let count = 0;

    function myHelper(name: string, greeting: string): string {
      count++;
      return `helper ${greeting} ${name}`;
    }

    const args = trackedObj({ name: 'Rob' });

    const MyComponent = setComponentTemplate(
      createTemplate({ myHelper }, '<h1>{{myHelper @name "Hello"}}</h1>'),
      templateOnlyComponent()
    );

    let html = await render(MyComponent, { args });

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');
    assert.equal(count, 1, 'helper rendered once');

    args.name = 'Tom';

    html = await settled();

    assert.strictEqual(html, '<h1>helper Hello Tom</h1>', 'the template was rendered');
    assert.equal(count, 2, 'simple helper reran after positional args changed');
  });

  test('custom helpers update when positional args change', async (assert) => {
    let count = 0;

    const myHelper = helper(
      class {
        args: {
          positional: [string];
          named: {
            greeting: string;
          };
        };

        get value(): string {
          count++;
          return `helper ${this.args.named.greeting} ${this.args.positional[0]}`;
        }
      }
    );

    let component: MyComponent;

    class MyComponent extends Component {
      constructor(owner: unknown, args: {}) {
        super(owner, args);
        component = this;
      }

      @tracked name = 'Rob';
      @tracked greeting = 'Hello';
    }

    setComponentTemplate(
      createTemplate({ myHelper }, '<h1>{{myHelper this.name greeting=this.greeting}}</h1>'),
      MyComponent
    );

    let html = await render(MyComponent);
    assert.equal(count, 1, 'helper rendered once');

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');

    component!.name = 'Tom';

    html = await settled();

    assert.strictEqual(html, '<h1>helper Hello Tom</h1>', 'the template was rendered');
    assert.equal(count, 2, 'helper reran after positional args changed');
  });

  test('custom helpers update when named args change', async (assert) => {
    let count = 0;

    const myHelper = helper(
      class {
        args: {
          positional: [string];
          named: {
            greeting: string;
          };
        };

        get value(): string {
          count++;
          return `helper ${this.args.named.greeting} ${this.args.positional[0]}`;
        }
      }
    );

    let component: MyComponent;

    class MyComponent extends Component {
      constructor(owner: unknown, args: {}) {
        super(owner, args);
        component = this;
      }

      @tracked name = 'Rob';
      @tracked greeting = 'Hello';
    }

    setComponentTemplate(
      createTemplate({ myHelper }, '<h1>{{myHelper this.name greeting=this.greeting}}</h1>'),
      MyComponent
    );

    let html = await render(MyComponent);
    assert.equal(count, 1, 'helper rendered once');

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');

    component!.greeting = 'Hola';

    html = await settled();

    assert.strictEqual(html, '<h1>helper Hola Rob</h1>', 'the template was rendered');
    assert.equal(count, 2, 'helper reran after named args changed');
  });

  test('helpers are not volatile', async (assert) => {
    let count = 0;

    function myHelper(name: string, greeting: string): string {
      count++;

      return `helper ${greeting} ${name}`;
    }

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
      createTemplate({ myHelper }, '<h1>{{myHelper this.name "Hello"}}</h1>'),
      MyComponent
    );

    let html = await render(MyComponent);

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');
    assert.equal(count, 1, 'helper rendered once');

    component!.foo = 456;

    html = await settled();

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');
    assert.equal(count, 1, 'helper did not rerender after unrelated change');
  });

  test('custom helpers lifecycle (basic)', async (assert) => {
    let calls: string[] = [];

    const myHelper = helper(
      class {
        args: {
          positional: [string];
          named: {
            greeting: string;
          };
        };

        setup(): void {
          // entangle a value that changes
          this.args.positional[0];
          calls.push('setup');
        }

        update(): void {
          calls.push('update');
        }

        teardown(): void {
          calls.push('teardown');
        }

        get value(): string {
          return `helper ${this.args.named.greeting} ${this.args.positional[0]}`;
        }
      }
    );

    let component: MyComponent;

    class MyComponent extends Component {
      constructor(owner: unknown, args: {}) {
        super(owner, args);
        component = this;
      }

      @tracked name = 'Rob';
      @tracked cond = true;
    }

    setComponentTemplate(
      createTemplate(
        { myHelper },
        '{{#if this.cond}}{{myHelper this.name greeting="Hello"}}{{/if}}'
      ),
      MyComponent
    );

    let html = await render(MyComponent);

    assert.strictEqual(html, 'helper Hello Rob', 'the template was rendered');
    assert.deepEqual(calls, ['setup'], 'setup hook called correctly');

    calls = [];
    component!.name = 'Tom';
    html = await settled();

    assert.strictEqual(html, 'helper Hello Tom', 'the template was updated');
    assert.deepEqual(calls, ['update'], 'update hook called correctly');

    calls = [];
    component!.cond = false;
    html = await settled();

    assert.strictEqual(html, '<!---->', 'the template was updated');
    assert.deepEqual(calls, ['teardown'], 'teardown hook called correctly');
  });

  test('update and value hook lifecycle and memoization', async (assert) => {
    // This is necessary because we can't create and dirty tags directly because
    // that doesn't trigger `propertyDidChange` currently.
    class Tag {
      @tracked private value = undefined;

      consume(): void {
        this.value;
      }

      dirty(): void {
        // eslint-disable-next-line no-self-assign
        this.value = this.value;
      }
    }

    const updateTag = new Tag();
    const valueTag = new Tag();

    let calls: string[] = [];

    const myHelper = helper(
      class {
        args: {
          positional: [string];
          named: {
            greeting: string;
          };
        };

        setup(): void {
          updateTag.consume();
          calls.push('setup');
        }

        update(): void {
          updateTag.consume();
          calls.push('update');
        }

        get value(): string {
          valueTag.consume();
          calls.push('value');

          return 'Hello, world!';
        }
      }
    );

    const MyComponent = setComponentTemplate(
      createTemplate({ myHelper }, '{{myHelper}}'),
      templateOnlyComponent()
    );

    let html = await render(MyComponent);

    assert.strictEqual(html, 'Hello, world!', 'the template was rendered');
    assert.deepEqual(
      calls,
      ['setup', 'value'],
      'setup and value hooks called on initial render in correct order'
    );

    calls = [];
    valueTag.dirty();
    html = await settled();

    assert.deepEqual(calls, ['value'], 'value hook called when tag used in value dirtied');

    calls = [];
    updateTag.dirty();
    html = await settled();

    assert.deepEqual(
      calls,
      ['update'],
      'update hook called when tag used in previous setup dirtied'
    );

    calls = [];
    valueTag.dirty();
    html = await settled();

    assert.deepEqual(calls, ['value'], 'value hook still called with tag used in value dirtied');

    calls = [];
    updateTag.dirty();
    html = await settled();

    assert.deepEqual(
      calls,
      ['update'],
      'update hook called when tag used in previous update dirtied'
    );

    calls = [];
    updateTag.dirty();
    valueTag.dirty();
    html = await settled();

    assert.deepEqual(
      calls,
      ['update', 'value'],
      'update and value hooks called in correct order when both tags dirtied'
    );
  });

  test('custom helpers update when local tracked props change', async (assert) => {
    let helperInstance: MyHelper;

    class MyHelper {
      constructor() {
        helperInstance = this;
      }

      @tracked locale = 'en_US';

      get value(): string {
        return this.locale;
      }
    }

    const myHelper = helper(MyHelper);

    const MyComponent = setComponentTemplate(
      createTemplate({ myHelper }, '<h1>{{myHelper}}</h1>'),
      templateOnlyComponent()
    );

    let html = await render(MyComponent);

    assert.strictEqual(html, '<h1>en_US</h1>', 'the template was rendered');

    helperInstance!.locale = 'en_UK';

    html = await settled();

    assert.strictEqual(html, '<h1>en_UK</h1>', 'the template was updated');
  });

  test('custom helpers update when values on owner change', async (assert) => {
    class Owner {
      services = {
        locale: new LocaleService(),
      };
    }

    class LocaleService {
      @tracked currentLocale = 'en_US';
    }

    const myHelper = helper(
      class {
        get value(): string {
          return getOwner<Owner>(this).services.locale.currentLocale;
        }
      }
    );

    const MyComponent = setComponentTemplate(
      createTemplate({ myHelper }, '<h1>{{myHelper}}</h1>'),
      templateOnlyComponent()
    );

    const owner = new Owner();

    let html = await render(MyComponent, { owner });

    assert.strictEqual(html, '<h1>en_US</h1>', 'the template was rendered');

    owner.services.locale.currentLocale = 'en_UK';

    html = await settled();

    assert.strictEqual(html, '<h1>en_UK</h1>', 'the template was updated');
  });
});
