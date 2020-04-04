import Component from '@glimmer/component';
import { createTemplate, setComponentTemplate } from '@glimmer/core';

export default class OtherComponent extends Component {}

setComponentTemplate(createTemplate(`<b>Counter Val: {{@count}}</b>`), OtherComponent);
