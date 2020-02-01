import './modifier-tests';
import renderTests from './render-tests';
import { renderComponent, RenderComponentOptions, ComponentFactory } from '..';

renderTests(
  '@glimmer/core',
  async (component: ComponentFactory, options?: RenderComponentOptions) => {
    const element = document.getElementById('qunit-fixture')!;
    element.innerHTML = '';

    if (options) {
      options.element = element;
      await renderComponent(component, options);
    } else {
      await renderComponent(component, element);
    }

    return element.innerHTML;
  }
);
