import { precompileTemplate, setComponentTemplate, templateOnlyComponent } from '@glimmer/core';

function toJSON(args): string {
  return JSON.stringify(args);
}

export default setComponentTemplate(
  precompileTemplate(
    `<div data-hydrate="{{@name}}" ...attributes>
      <script type="application/hydrate">{{toJSON @data}}</script>
      {{yield}}
     </div>
    `,
    { strictMode: true, scope: { toJSON } }
  ),
  templateOnlyComponent()
);
