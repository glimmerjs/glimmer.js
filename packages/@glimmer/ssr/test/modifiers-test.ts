import {
  setComponentTemplate,
  precompileTemplate,
  templateOnlyComponent,
  setModifierManager,
  modifierCapabilities,
  ModifierManager,
} from '@glimmer/core';
import { renderToString } from '..';

class CustomModifier {
  element?: Element;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  didInsertElement(): void {}
}

class CustomModifierManager implements ModifierManager<CustomModifier> {
  capabilities = modifierCapabilities('3.13');

  constructor(private owner: unknown) {}

  createModifier(factory: { new (owner: unknown): CustomModifier }): CustomModifier {
    return new factory(this.owner);
  }

  installModifier(instance: CustomModifier): void {
    instance.didInsertElement();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateModifier(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  destroyModifier(): void {}
}

setModifierManager((owner) => new CustomModifierManager(owner), CustomModifier);

QUnit.module('@glimmer/ssr modifiers', () => {
  QUnit.test('modifiers do not run in SSR', async (assert) => {
    class Modifier extends CustomModifier {
      didInsertElement(): void {
        assert.ok(false, 'modifiers should not trigger insert in SSR');
      }
    }

    const Component = templateOnlyComponent();
    setComponentTemplate(
      precompileTemplate('<h1 {{Modifier}}>hello world</h1>', {
        strictMode: true,
        scope: { Modifier },
      }),
      Component
    );

    const output = await renderToString(Component);

    assert.equal(output, '<h1>hello world</h1>');
  });
});
