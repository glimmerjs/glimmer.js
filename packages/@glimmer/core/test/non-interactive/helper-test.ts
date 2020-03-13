import { module, test, render } from '../utils';
import { helper } from '../utils/custom-helper';

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import {
  templateOnlyComponent,
  setComponentTemplate,
  createTemplate,
  getOwner,
} from '@glimmer/core';

module('[@glimmer/core] non-interactive - helper', () => {
  test('simple helpers work', async assert => {
    function myHelper(name: string, greeting: string): string {
      return `helper ${greeting} ${name}`;
    }

    class MyComponent extends Component {
      @tracked name = 'Rob';
      @tracked foo = 123;
    }

    setComponentTemplate(
      MyComponent,
      createTemplate({ myHelper }, '<h1>{{myHelper this.name "Hello"}}</h1>')
    );

    const html = await render(MyComponent);

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');
  });

  test('simple helpers throw when using named args', assert => {
    function myHelper(): void {
      assert.ok(false, 'helper should not be called');
    }

    class MyComponent extends Component {}

    setComponentTemplate(
      MyComponent,
      createTemplate({ myHelper }, '<h1>{{myHelper this.name greeting="Hello"}}</h1>')
    );

    assert.rejects(
      render(MyComponent),
      /Error: You used named arguments with the myHelper helper, but it is a standard function. Normal functions cannot receive named arguments when used as helpers./
    );
  });

  test('custom helpers work', async assert => {
    const myHelper = helper(
      class {
        args: {
          positional: [string];
          named: {
            greeting: string;
          };
        };

        get value(): string {
          return `helper ${this.args.named.greeting} ${this.args.positional[0]}`;
        }
      }
    );

    class MyComponent extends Component {
      @tracked name = 'Rob';
      @tracked foo = 123;
    }

    setComponentTemplate(
      MyComponent,
      createTemplate({ myHelper }, '<h1>{{myHelper this.name greeting="Hello"}}</h1>')
    );

    const html = await render(MyComponent);

    assert.strictEqual(html, '<h1>helper Hello Rob</h1>', 'the template was rendered');
  });

  test('custom helpers have access to host meta', async assert => {
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

    const myHelper = helper(
      class {
        get value(): string {
          return getOwner<Owner>(this).services.locale.currentLocale;
        }
      }
    );

    const MyComponent = templateOnlyComponent();

    setComponentTemplate(MyComponent, createTemplate({ myHelper }, '<h1>{{myHelper}}</h1>'));

    const html = await render(MyComponent, {
      owner: new Owner(),
    });

    assert.strictEqual(html, '<h1>en_US</h1>', 'the template was rendered');
  });
});
