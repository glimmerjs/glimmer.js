import Component from '@glimmerx/component';
import { setComponentTemplate } from '@glimmerx/core';
import { compileTemplate } from '@glimmerx/core/tests/utils';
import HTMLSerializer from '@simple-dom/serializer';
import voidMap from '@simple-dom/void-map';
import { SerializableNode } from '@simple-dom/interface';
import { renderToString, RenderOptions } from '..';

QUnit.module('@glimmer/ssr rendering', () => {
  QUnit.test('options.serializer', async assert => {
    class MyComponent extends Component {}

    class CustomHTMLSerializer extends HTMLSerializer {
      text(text: SerializableNode) {
        return super.text(text).replace(/Hello/g, 'Goodbye'); // Replaces repetitive whitespace with a single character.
      }
    }

    const options: RenderOptions = { serializer: new CustomHTMLSerializer(voidMap) };

    setComponentTemplate(MyComponent, compileTemplate(`<h1>Hello World</h1>`));

    const output = await renderToString(MyComponent, options);

    assert.equal(output, '<h1>Goodbye World</h1>');
  });
});
