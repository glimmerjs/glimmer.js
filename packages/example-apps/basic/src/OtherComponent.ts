import Component from '@glimmer/component';
import { precompileTemplate, setComponentTemplate } from '@glimmer/core';

export default class OtherComponent extends Component {}

setComponentTemplate(
  precompileTemplate(`<b>Counter Val: {{@count}}</b>`, { strictMode: true }),
  OtherComponent
);
