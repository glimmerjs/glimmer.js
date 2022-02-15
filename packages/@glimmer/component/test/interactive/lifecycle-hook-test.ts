import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { test, render, settled } from '@glimmer/core/test/utils';
import { setComponentTemplate, precompileTemplate } from '@glimmer/core';

QUnit.module('[@glimmer/component] Lifecycle Hooks', () => {
  test('Lifecycle hook ordering', async function (assert) {
    assert.expect(2);

    let invocations: [string, string][] = [];
    let component1: Component1;

    abstract class HookLoggerComponent extends Component<{ name: string }> {
      constructor(owner: object, args: { name: string }) {
        super(owner, args);
        invocations.push([this.args.name, 'constructor']);
      }

      willDestroy(): void {
        invocations.push([this.args.name, 'willDestroy']);
      }
    }

    class Component1 extends HookLoggerComponent {
      @tracked firstName = 'Chirag';
      @tracked showChildren = true;

      constructor(owner: object, args: { name: string }) {
        super(owner, args);
        component1 = this;
      }
    }
    class Component2 extends HookLoggerComponent {}
    class Component3 extends HookLoggerComponent {}
    class Component4 extends HookLoggerComponent {}
    class Component5 extends HookLoggerComponent {}

    setComponentTemplate(
      precompileTemplate(
        `
          {{#if this.showChildren}}
            <Component2 @name="component2" @firstName={{this.firstName}} />
            <Component3 @name="component3"/>
          {{/if}}
        `,
        {
          strictMode: true,
          scope: { Component2, Component3 },
        }
      ),
      Component1
    );

    setComponentTemplate(
      precompileTemplate(
        `
          {{@firstName}}
          <Component4 @name="component4"/>
          <Component5 @name="component5"/>
        `,
        {
          strictMode: true,
          scope: { Component4, Component5 },
        }
      ),
      Component2
    );

    const emptyTemplate = precompileTemplate('');

    setComponentTemplate(emptyTemplate, Component3);
    setComponentTemplate(emptyTemplate, Component4);
    setComponentTemplate(emptyTemplate, Component5);

    await render(Component1, { args: { name: 'component1' } });

    assert.deepEqual(invocations, [
      ['component1', 'constructor'],
      ['component2', 'constructor'],
      ['component4', 'constructor'],
      ['component5', 'constructor'],
      ['component3', 'constructor'],
    ]);

    invocations = [];

    component1!.showChildren = false;

    await settled();

    assert.deepEqual(invocations, [
      ['component2', 'willDestroy'],
      ['component4', 'willDestroy'],
      ['component5', 'willDestroy'],
      ['component3', 'willDestroy'],
    ]);
  });
});
