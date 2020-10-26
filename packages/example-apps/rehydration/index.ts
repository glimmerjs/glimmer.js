import { renderComponent } from '@glimmer/core';
import MyComponent from './src/MyComponent';

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const element = document.getElementById('app');
    renderComponent(MyComponent, {
      element: element!,
      rehydrate: true,
    });
  },
  { once: true }
);
