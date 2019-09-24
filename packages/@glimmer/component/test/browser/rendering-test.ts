import { buildApp } from '@glimmer/application-test-helpers';

const { module, test } = QUnit;

module('[@glimmer/component] Rendering');

test('A component can be rendered in a template', async function(assert) {
  let app = await buildApp()
    .template('Main', '<div><HelloWorld></HelloWorld></div>')
    .template('HelloWorld', '<h1><PersonCard @name="Tom"/></h1>')
    .template('PersonCard', '<span>Hello, {{@name}}!</span>')
    .boot();

  assert.equal(app.rootElement.textContent, 'Hello, Tom!');
});