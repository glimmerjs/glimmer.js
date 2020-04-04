import Component from '@glimmer/component';
import { setComponentTemplate, createTemplate } from '@glimmer/core';
import HTMLSerializer from '@simple-dom/serializer';
import voidMap from '@simple-dom/void-map';
import { SerializableNode } from '@simple-dom/interface';
import { renderToString, RenderOptions } from '..';

QUnit.module('@glimmer/ssr rendering', () => {
  QUnit.test('options.serializer', async (assert) => {
    class MyComponent extends Component {}

    class CustomHTMLSerializer extends HTMLSerializer {
      text(text: SerializableNode): string {
        return super.text(text).replace(/Hello/g, 'Goodbye'); // Replaces repetitive whitespace with a single character.
      }
    }

    const options: RenderOptions = { serializer: new CustomHTMLSerializer(voidMap) };

    setComponentTemplate(createTemplate(`<h1>Hello World</h1>`), MyComponent);

    const output = await renderToString(MyComponent, options);

    assert.equal(output, '<h1>Goodbye World</h1>');
  });
});
