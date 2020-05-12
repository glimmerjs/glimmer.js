import Component from '@glimmer/component';

import { setComponentTemplate, createTemplate } from '@glimmer/core';

import { module, test, render } from '../utils';

module(`[@glimmer/core] non-interactive rendering tests`, () => {
  test(`normal if treats empty arrays as falsy`, async function (assert) {
    class Main extends Component {
      pred = [];
      salutation = 'Glimmer';
      alternative = 'Glimmer.js';
    }

    setComponentTemplate(
      createTemplate('Hello {{if this.pred this.salutation this.alternative}}!'),
      Main
    );

    assert.equal(await render(Main), `Hello Glimmer.js!`, 'output is correct');
  });

  test(`inline if treats empty arrays as falsy`, async function (assert) {
    class Main extends Component {
      pred = [];
    }

    setComponentTemplate(
      createTemplate('Hello {{#if this.pred}}Glimmer{{else}}Glimmer.js{{/if}}!'),
      Main
    );

    assert.equal(await render(Main), `Hello Glimmer.js!`, 'output is correct');
  });
});
