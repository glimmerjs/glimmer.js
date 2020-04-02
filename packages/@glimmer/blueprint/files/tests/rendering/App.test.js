import { module, test, renderComponent } from '../util';

import App from '../../src/App';

module('App test', () => {
  test('it works', async (assert) => {
    await renderComponent(App);

    assert.dom('h1').containsText('hello, glimmer!');
    assert.dom('h3').containsText('you can get started by editing src/App.js');

    assert.dom('img').exists();
  });
});
