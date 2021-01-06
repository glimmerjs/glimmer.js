import { precompileTemplate } from '@glimmer/core';
import Component from './component';

precompileTemplate({ MyComponent: Component }, `<MyComponent/>`);
