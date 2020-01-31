import './modifier-tests';
import renderTests from './render-tests';
import { renderComponent, RenderComponentOptions } from '..';
import { Constructor } from '../src/interfaces';
import Component from '@glimmerx/component';

renderTests(
  '@glimmerx/core',
  async (component: Constructor<Component>, options?: RenderComponentOptions) => {
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
