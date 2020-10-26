import { renderComponent } from '@glimmer/core';
import RehydratingComponent from './src/RehydratingComponent';

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const element = document.querySelector('.static-component');
    renderComponent(RehydratingComponent, {
      element: element!,
      rehydrate: true,
    });
  },
  { once: true }
);
