import Component from '@glimmer/component';
import { createTemplate, setComponentTemplate } from '@glimmer/core';

export default class BsButton extends Component {}

setComponentTemplate(
  BsButton,
  createTemplate(`<button
type="button"
class="btn btn-primary btn-block"
...attributes>
{{yield}}
</button>
`)
);
