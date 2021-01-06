import { precompileTemplate } from '@glimmer/core';
import Component from './component';

precompileTemplate({ Component }, `<Component/>`);

precompileTemplate({ Component }, '<Component/>');
