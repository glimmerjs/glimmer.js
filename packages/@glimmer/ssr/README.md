# API Usage

```js
import { setComponentTemplate } from '@glimmer/core';
import component from '@glimmer/component';
import { renderToString } from '@glimmer/ssr';

import { templateFactory } from '@glimmer/opcode-compiler';
import { precompile } from '@glimmer/compiler';

let GlimmerComponent = component.default;

class PageComponent extends GlimmerComponent {}

let template = `
  {{#let "hello" "world" as |hello world|}}<p>{{hello}} {{world}}</p>{{/let}}
`;

setComponentTemplate(
  templateFactory(JSON.parse(precompile(template, { strictMode: true }))),
  PageComponent
);

// Print <p>hello world</p> to console:
console.log(await renderToString(PageComponent, {
  owner: {
    services: {}
  },
}));
```
