import renderTests from '@glimmer/core/tests/render-tests';
import { ComponentFactory } from '@glimmer/core';
import { renderToString, RenderOptions } from '..';

renderTests('@glimmer/ssr', async (component: ComponentFactory, options: RenderOptions) => {
  return await renderToString(component, options);
});
