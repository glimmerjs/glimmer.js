import hbs from '@glimmer/inline-precompile';
import { render, setupRenderingTest } from '@glimmer/test-helpers';

const { module, test } = QUnit;

module('Component: <%= component %>', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`<<%= component %> />`);
    assert.equal(this.containerElement.textContent, 'Welcome to Glimmer!\n');
  });
});
