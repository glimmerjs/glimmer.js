import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Integration - Rendering');

test('A component can be rendered in a template', function(assert) {
  let app = buildApp('test-app')
    .template('main', '<hello-world></hello-world>')
    .template('hello-world', '<h1><person-card @name="Tom"/></h1>')
    .template('person-card', '<span>Hello, {{@name}}!</span>')
    .boot();

  assert.equal(app.rootElement.innerText, 'Hello, Tom!');
});