import { createTemplate, setComponentTemplate, templateOnlyComponent } from '@glimmer/core';

function toJSON(args) {
  return JSON.stringify(args);
}

export default setComponentTemplate(
  createTemplate(
    { toJSON },
    `<div data-hydrate="{{@name}}" ...attributes>
      <script type="application/hydrate">{{toJSON @data}}</script>
      {{yield}}
     </div>
    `
  ),
  templateOnlyComponent()
);
