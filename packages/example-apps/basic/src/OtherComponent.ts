import Component from '@glimmer/component';
import {
  createTemplate,
  setComponentTemplate,
} from '@glimmer/core';

export default class OtherComponent extends Component {}

setComponentTemplate(OtherComponent, createTemplate(`<b>Counter Val: {{@count}}</b>`));
