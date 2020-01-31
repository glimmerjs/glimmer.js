import { createTemplate } from '@glimmer/core';
import Component from './component';

createTemplate({ Component }, `<Component/>`);

createTemplate({ Component }, '<Component/>');
