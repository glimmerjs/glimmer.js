import { precompileTemplate, setComponentTemplate, templateOnlyComponent } from '@glimmer/core';

function toJSON(args): string {
  return JSON.stringify(args);
}

export default setComponentTemplate(
  precompileTemplate(
    { toJSON },
    `<div data-hydrate="{{@name}}" ...attributes>
      <script type="application/hydrate">{{toJSON @data}}</script>
      {{yield}}
     </div>
    `
  ),
  templateOnlyComponent()
);
