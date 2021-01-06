import { test, render, settled, tracked } from '../utils';
import Component from '@glimmer/component';
import { fn } from '@glimmer/helper';
import { on, action } from '@glimmer/modifier';

import { setComponentTemplate, precompileTemplate, templateOnlyComponent } from '@glimmer/core';

QUnit.module('[@glimmer/core] interactive - {{fn}}', () => {
  test('can curry arguments via fn', async function (assert) {
    assert.expect(9);

    let helloWorldComponent: HelloWorld;
    let passedMsg1, passedMsg2, passedEvent: MouseEvent | undefined;

    const args = tracked({ name: 'world' });
    class HelloWorld extends Component {
      constructor(owner: object, args: {}) {
        super(owner, args);
        helloWorldComponent = this;
      }

      @action
      userDidClick(msg1: string, msg2: string, event: MouseEvent): void {
        passedMsg1 = msg1;
        passedMsg2 = msg2;
        passedEvent = event;
        assert.strictEqual(this, helloWorldComponent, 'function context is preserved');
      }
    }

    setComponentTemplate(
      precompileTemplate(
        { on, fn },
        '<button {{on "click" (fn this.userDidClick "hello" @name)}}>Hello World</button>'
      ),
      HelloWorld
    );

    const output = await render(HelloWorld, { args });

    assert.strictEqual(output, '<button>Hello World</button>');

    const element = document.getElementById('qunit-fixture')!;
    const button = element.querySelector('button')!;
    button.click();

    assert.strictEqual(passedMsg1, 'hello');
    assert.strictEqual(passedMsg2, 'world');
    assert.ok(passedEvent instanceof MouseEvent);
    passedEvent = undefined;

    args.name = 'cruel world';

    await settled();

    button.click();

    assert.strictEqual(passedMsg1, 'hello');
    assert.strictEqual(passedMsg2, 'cruel world');
    assert.ok(passedEvent! instanceof MouseEvent);
  });

  test('functions can be curried multiple times', async function (assert) {
    assert.expect(2);

    let parentComponent: ParentComponent;
    let passed: Array<number | Event> = [];

    class ParentComponent extends Component {
      name = 'world';

      constructor(owner: object, args: {}) {
        super(owner, args);
        parentComponent = this;
      }

      @action
      userDidClick(a1: number, a2: number, a3: number, a4: number, a5: number, a6: number): void {
        passed = [a1, a2, a3, a4, a5, a6];
        assert.strictEqual(this, parentComponent, 'function context is preserved');
      }
    }

    const Grandchild = setComponentTemplate(
      precompileTemplate({ on, fn }, '<button {{on "click" (fn @userDidClick 5 6)}}></button>'),
      templateOnlyComponent()
    );

    const Child = setComponentTemplate(
      precompileTemplate(
        { Grandchild, fn },
        '<div><Grandchild @userDidClick={{fn @userDidClick 3 4}} /></div>'
      ),
      templateOnlyComponent()
    );

    setComponentTemplate(
      precompileTemplate(
        { Child, fn },
        '<div><Child @userDidClick={{fn this.userDidClick 1 2}} /></div>'
      ),
      ParentComponent
    );

    await render(ParentComponent);

    const element = document.getElementById('qunit-fixture')!;
    const button = element.querySelector('button')!;

    button.click();

    assert.deepEqual(passed, [1, 2, 3, 4, 5, 6]);
  });

  test('action helper invoked without a function raises an error', function (assert) {
    class Parent extends Component {}

    setComponentTemplate(
      precompileTemplate({ on, fn }, '<button {{on "click" (fn this.doesntExist)}}></button>'),
      Parent
    );

    assert.rejects(render(Parent), /You must pass a function as the `fn` helpers first argument/);
  });
});
