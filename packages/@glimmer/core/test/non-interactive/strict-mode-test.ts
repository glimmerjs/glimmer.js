import Component from '@glimmer/component';

import { setComponentTemplate, createTemplate } from '@glimmer/core';

import { module, test, render } from '../utils';
import { DEBUG } from '@glimmer/env';

if (DEBUG) {
  module(`[@glimmer/core] non-interactive strict-mode tests`, () => {
    test('throws a helpful error if upvar is used directly in a template invocation and not found in scope', async (assert) => {
      assert.throws(() => {
        class MyComponent extends Component {
          say = 'Hello Dolly!';
        }

        setComponentTemplate(MyComponent, createTemplate('<h1>{{say}}</h1>'));
      }, /Error: Cannot find identifier `say` in scope. It was used in a template, but not imported into the template scope or defined as a local variable. If you meant to access a property, you must add `this` to it: `{{this.say}}`/);
    });

    test('throws a helpful error if upvar is used as an argument and not found in scope', async (assert) => {
      assert.throws(() => {
        class MyComponent extends Component {
          say = 'Hello Dolly!';
        }

        function myHelper(param1: unknown): unknown {
          return param1;
        }

        setComponentTemplate(
          MyComponent,
          createTemplate({ myHelper }, '<h1>{{myHelper say}}</h1>')
        );
      }, /Error: Cannot find identifier `say` in scope. It was used in a template, but not imported into the template scope or defined as a local variable. If you meant to access a property, you must add `this` to it: `{{this.say}}`/);
    });

    test('throws a helpful error if upvar is used as a helper', async (assert) => {
      assert.throws(() => {
        class MyComponent extends Component {
          say = 'Hello Dolly!';
        }

        setComponentTemplate(MyComponent, createTemplate('<h1>{{say this.bar}}</h1>'));
      }, /Error: Cannot find identifier `say` in scope. It was used in a template, but not imported into the template scope or defined as a local variable. If you meant to access a property, you must add `this` to it: `{{this.say}}`/);
    });

    test('throws a helpful error if upvar is used as a modifier', async (assert) => {
      assert.throws(() => {
        class MyComponent extends Component {
          say = 'Hello Dolly!';
        }

        setComponentTemplate(MyComponent, createTemplate('<h1 {{say}}>Hello Dolly!</h1>'));
      }, /Error: Cannot find identifier `say` in scope. It was used in a template, but not imported into the template scope or defined as a local variable. If you meant to access a property, you must add `this` to it: `{{this.say}}`/);
    });

    test('throws a helpful error if upvar is used as a component', async (assert) => {
      assert.expect(1);

      try {
        await render(createTemplate(`<NonExistent />`));
      } catch (err) {
        assert.ok(
          err
            .toString()
            .match(
              /Cannot find component `NonExistent` in scope. It was used in a template, but not imported into the template scope or defined as a local variable. If you meant to access a property, you must add `this` to it: `<this.NonExistent>`/
            )
        );
      }
    });
  });
}
