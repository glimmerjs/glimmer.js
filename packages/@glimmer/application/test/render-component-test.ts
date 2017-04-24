import buildApp from './test-helpers/test-app';
import SimpleDOM from 'simple-dom';

const { module, test } = QUnit;
const serializer = new SimpleDOM.HTMLSerializer(SimpleDOM.voidMap);

module('renderComponent');

test('renders a component', function(assert) {
  assert.expect(1);

  let containerElement = document.createElement('div');

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot();

  return app.renderComponent('hello-world', containerElement).then(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
  });
});

test('renders a component without affecting existing content', function(assert) {
  assert.expect(2);

  let containerElement = document.createElement('div');
  let previousSibling = document.createElement('p');

  previousSibling.appendChild(document.createTextNode('foo'));
  containerElement.appendChild(previousSibling);
  containerElement.appendChild(document.createTextNode('bar'));

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<p>foo</p>bar');

  return app.renderComponent('hello-world', containerElement).then(() => {
    assert.equal(containerElement.innerHTML, '<p>foo</p>bar<h1>Hello Glimmer!</h1>');
  });
});

test('renders a component before a given sibling', function(assert) {
  assert.expect(2);

  let containerElement = document.createElement('div');
  let previousSibling = document.createElement('p');
  let nextSibling = document.createElement('aside');

  containerElement.appendChild(previousSibling);
  containerElement.appendChild(nextSibling);

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<p></p><aside></aside>');

  return app.renderComponent('hello-world', containerElement, nextSibling).then(() => {
    assert.equal(containerElement.innerHTML, '<p></p><h1>Hello Glimmer!</h1><aside></aside>');
  });
});

test('renders multiple components in different places', function(assert) {
  assert.expect(2);

  let firstContainerElement = document.createElement('div');
  let secondContainerElement = document.createElement('div');

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .template('hello-robbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  return Promise.all([
    app.renderComponent('hello-world', firstContainerElement),
    app.renderComponent('hello-robbie', secondContainerElement)
  ]).then(() => {
    assert.equal(firstContainerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
    assert.equal(secondContainerElement.innerHTML, '<h1>Hello Robbie!</h1>');
  });
});

test('renders multiple components in the same container', function(assert) {
  assert.expect(1);

  let containerElement = document.createElement('div');

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .template('hello-robbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  return Promise.all([
    app.renderComponent('hello-world', containerElement),
    app.renderComponent('hello-robbie', containerElement)
  ]).then(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1><h1>Hello Robbie!</h1>');
  });
});

test('renders multiple components in the same container in particular places', function(assert) {
  assert.expect(2);

  let containerElement = document.createElement('div');
  let nextSibling = document.createElement('aside');

  containerElement.appendChild(nextSibling);

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .template('hello-robbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<aside></aside>');

  return Promise.all([
    app.renderComponent('hello-world', containerElement),
    app.renderComponent('hello-robbie', containerElement, nextSibling)
  ]).then(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Robbie!</h1><aside></aside><h1>Hello Glimmer!</h1>');
  });
});

test('renders a component using simple-dom', function(assert) {
  assert.expect(1);

  let customDocument = new SimpleDOM.Document();

  let containerElement = customDocument.createElement('div');

  let app = buildApp('test-app', { document: customDocument })
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot();

  return app.renderComponent('hello-world', containerElement).then(() => {
    let serializedHTML = serializer.serialize(containerElement);
    assert.equal(serializedHTML, '<div><h1>Hello Glimmer!</h1></div>');
  });
});
