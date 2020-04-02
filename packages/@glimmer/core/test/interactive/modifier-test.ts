import { module, test, render, settled, tracked } from '../utils';
import { click, find } from '../utils/dom';

import { on, action } from '@glimmer/modifier';
import Component from '@glimmer/component';
import {
  setComponentTemplate,
  createTemplate,
  templateOnlyComponent,
  modifierCapabilities,
  TemplateArgs,
  setModifierManager,
  ModifierManager,
} from '@glimmer/core';
import { Dict } from '@glimmer/interfaces';

class CustomModifier {
  element?: Element;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  didInsertElement(_positional: unknown[], _named: Dict<unknown>): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  didUpdate(_positional: unknown[], _named: Dict<unknown>): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  willDestroyElement(): void {}
}

class CustomModifierManager implements ModifierManager<CustomModifier> {
  capabilities = modifierCapabilities('3.13');

  constructor(private owner: unknown) {}

  createModifier(factory: { new (owner: unknown): CustomModifier }): CustomModifier {
    return new factory(this.owner);
  }

  installModifier(instance: CustomModifier, element: Element, args: TemplateArgs): void {
    instance.element = element;
    const { positional, named } = args;
    instance.didInsertElement(positional, named);
  }

  updateModifier(instance: CustomModifier, args: TemplateArgs): void {
    const { positional, named } = args;
    instance.didUpdate(positional, named);
  }

  destroyModifier(instance: CustomModifier): void {
    instance.willDestroyElement();
  }
}

setModifierManager((owner) => new CustomModifierManager(owner), CustomModifier);

module('Modifier Tests', () => {
  test('Supports the on modifier', async (assert) => {
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

    assert.strictEqual(
      await render(MyComponent),
      `<button>Count: 0</button>`,
      'the component was rendered'
    );

    click('button');

    assert.strictEqual(
      await settled(),
      `<button>Count: 1</button>`,
      'the component was rerendered'
    );
  });

  test('simple functions can be used as modifiers', async (assert) => {
    function modifier(element: Element, arg1: string, arg2: number): void {
      assert.equal(element, find('h1'), 'modifier received');
      assert.equal(arg1, 'string', 'modifier received');
      assert.equal(arg2, 123, 'modifier received');
    }

    const Component = templateOnlyComponent();
    setComponentTemplate(
      Component,
      createTemplate({ modifier }, '<h1 {{modifier "string" 123}}>hello world</h1>')
    );

    await render(Component);
  });

  test('simple function modifiers throw an error when using named arguments', async (assert) => {
    function modifier(): void {
      assert.ok(false, 'should not be called');
    }

    const Component = templateOnlyComponent();
    setComponentTemplate(
      Component,
      createTemplate({ modifier }, '<h1 {{modifier named=456}}>hello world</h1>')
    );

    try {
      await render(Component);
    } catch (e) {
      assert.equal(
        e.message,
        'You used named arguments with the modifier modifier, but it is a standard function. Normal functions cannot receive named arguments when used as modifiers.',
        'error thrown correctly'
      );
    }
  });

  test('simple function modifier lifecycle', async (assert) => {
    const hooks: string[] = [];

    function modifier(): () => void {
      hooks.push('installed');

      return (): void => {
        hooks.push('removed');
      };
    }

    const Component = templateOnlyComponent();
    setComponentTemplate(
      Component,
      createTemplate({ modifier }, '{{#if @truthy}}<h1 {{modifier @value}}>hello world</h1>{{/if}}')
    );

    await render(Component);

    const args = tracked({
      truthy: true,
      value: 123,
    });

    await render(Component, { args });

    assert.deepEqual(hooks, ['installed'], 'installs correctly');

    // trigger update
    args.value = 456;
    await settled();

    assert.deepEqual(
      hooks,
      ['installed', 'removed', 'installed'],
      'removes and reinstalls on updates'
    );

    // trigger destruction
    args.truthy = false;
    await settled();

    assert.deepEqual(
      hooks,
      ['installed', 'removed', 'installed', 'removed'],
      'removes on final destruction'
    );
  });

  test('custom modifiers correctly receive element', async (assert) => {
    assert.expect(3);

    class Modifier extends CustomModifier {
      didInsertElement(positional: unknown[]): void {
        positional[0];
        assert.equal(this.element, find('h1'), 'element is correctly assigned in didInsertElement');
      }

      didUpdate(): void {
        assert.equal(this.element, find('h1'), 'element still exists in didUpdate');
      }

      willDestroyElement(): void {
        assert.ok(
          this.element instanceof HTMLElement,
          'element still exists in willDestroyElement'
        );
      }
    }

    const Component = templateOnlyComponent();
    setComponentTemplate(
      Component,
      createTemplate(
        { modifier: Modifier },
        '{{#if @truthy}}<h1 {{modifier @value foo=@value}}>hello world</h1>{{/if}}'
      )
    );

    const args = tracked({
      truthy: true,
      value: 123,
    });

    await render(Component, { args });

    // trigger update
    args.value = 456;
    await settled();

    // trigger destruction
    args.truthy = false;
    await settled();
  });

  test('custom lifecycle hooks', async (assert) => {
    const hooks: string[] = [];
    const positionalArgs: unknown[][] = [];
    const namedArgs: Dict<unknown>[] = [];

    class Modifier extends CustomModifier {
      didInsertElement(positional: unknown[], named: Dict<unknown>): void {
        hooks.push('didInsertElement');
        positionalArgs.push(positional.slice());
        namedArgs.push(Object.assign({}, named));
      }

      didUpdate(positional: unknown[], named: Dict<unknown>): void {
        hooks.push('didUpdate');
        positionalArgs.push(positional.slice());
        namedArgs.push(Object.assign({}, named));
      }

      willDestroyElement(): void {
        hooks.push('willDestroyElement');
      }
    }

    const Component = templateOnlyComponent();
    setComponentTemplate(
      Component,
      createTemplate(
        { modifier: Modifier },
        '{{#if @truthy}}<h1 {{modifier @value foo=@value}}>hello world</h1>{{/if}}'
      )
    );

    const args = tracked({
      truthy: true,
      value: 123,
    });

    await render(Component, { args });

    assert.deepEqual(hooks, ['didInsertElement'], 'modifier initialized correctly');
    assert.deepEqual(positionalArgs, [[123]], 'modifier initialized correctly');
    assert.deepEqual(namedArgs, [{ foo: 123 }], 'modifier initialized correctly');

    args.value = 456;
    await settled();

    assert.deepEqual(hooks, ['didInsertElement', 'didUpdate'], 'modifier initialized correctly');
    assert.deepEqual(positionalArgs, [[123], [456]], 'modifier initialized correctly');
    assert.deepEqual(namedArgs, [{ foo: 123 }, { foo: 456 }], 'modifier initialized correctly');

    args.truthy = false;
    await settled();

    assert.deepEqual(
      hooks,
      ['didInsertElement', 'didUpdate', 'willDestroyElement'],
      'modifier initialized correctly'
    );
    assert.deepEqual(positionalArgs, [[123], [456]], 'modifier initialized correctly');
    assert.deepEqual(namedArgs, [{ foo: 123 }, { foo: 456 }], 'modifier initialized correctly');
  });

  test('lifecycle hooks are autotracked by default', async (assert) => {
    const obj = tracked({
      foo: 123,
      bar: 456,
    });

    const hooks: string[] = [];

    class Modifier extends CustomModifier {
      didInsertElement(): void {
        // read and entangle
        obj.foo;
        hooks.push('insert');
      }

      didUpdate(): void {
        // read and entangle
        obj.bar;
        hooks.push('update');
      }
    }

    const Component = templateOnlyComponent();
    setComponentTemplate(
      Component,
      createTemplate({ modifier: Modifier }, '<h1 {{modifier}}>hello world</h1>')
    );

    const html = await render(Component);
    assert.equal(html, `<h1>hello world</h1>`, 'rendered correctly');

    assert.deepEqual(hooks, ['insert'], 'correct hooks called on initial render');

    obj.bar++;
    await settled();

    assert.deepEqual(hooks, ['insert'], 'update not called when unconsumed prop is updated');

    obj.foo++;
    await settled();

    assert.deepEqual(
      hooks,
      ['insert', 'update'],
      'update called when prop consumed in prop is updated'
    );

    obj.foo++;
    await settled();

    assert.deepEqual(
      hooks,
      ['insert', 'update'],
      'update not called when unconsumed prop is updated'
    );

    obj.bar++;
    await settled();

    assert.deepEqual(
      hooks,
      ['insert', 'update', 'update'],
      'update called when prop consumed in prop is updated'
    );
  });
});
