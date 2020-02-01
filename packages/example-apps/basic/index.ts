import { renderComponent } from '@glimmer/core';
import MyComponent from './src/MyComponent';
import LocaleService from './src/services/LocaleService';

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const element = document.getElementById('app');
    renderComponent(MyComponent, {
      element: element!,
      scope: {
        locale: new LocaleService('en_US'),
      },
    });
  },
  { once: true }
);
