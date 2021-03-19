import Component from '@glimmer/component';

import { setComponentTemplate, precompileTemplate } from '@glimmer/core';

import { test, render } from '../utils';

QUnit.module(`[@glimmer/core] non-interactive rendering tests`, () => {
  test(`normal if treats empty arrays as falsy`, async function (assert) {
    class Main extends Component {
      pred = [];
      salutation = 'Glimmer';
      alternative = 'Glimmer.js';
    }

    setComponentTemplate(
      precompileTemplate('Hello {{if this.pred this.salutation this.alternative}}!', {
        strictMode: true,
      }),
      Main
    );

    assert.equal(await render(Main), `Hello Glimmer.js!`, 'output is correct');
  });

  test(`inline if treats empty arrays as falsy`, async function (assert) {
    class Main extends Component {
      pred = [];
    }

    setComponentTemplate(
      precompileTemplate('Hello {{#if this.pred}}Glimmer{{else}}Glimmer.js{{/if}}!', {
        strictMode: true,
      }),
      Main
    );

    assert.equal(await render(Main), `Hello Glimmer.js!`, 'output is correct');
  });
});
