import { createTemplate } from '@glimmer/core';

import { module, test, render } from '../utils';

module(`[@glimmer/core] interactive rendering tests`, () => {
  test('renders multiple components in different places', async (assert) => {
    assert.expect(2);

    // Note: Should try to figure out how to do this in Node so we can make this
    // a non-interactive test
    const firstContainerElement = document.createElement('div');
    const secondContainerElement = document.createElement('div');

    await render(createTemplate(`<h1>Hello Glimmer!</h1>`), firstContainerElement);
    await render(createTemplate(`<h1>Hello Robbie!</h1>`), secondContainerElement);

    assert.equal(firstContainerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
    assert.equal(secondContainerElement.innerHTML, '<h1>Hello Robbie!</h1>');
  });

  test('renders a component without affecting existing content', async (assert) => {
    assert.expect(1);

    // Note: Should try to figure out how to do this in Node so we can make this
    // a non-interactive test
    const containerElement = document.createElement('div');
    const previousSibling = document.createElement('p');

    previousSibling.appendChild(document.createTextNode('foo'));
    containerElement.appendChild(previousSibling);
    containerElement.appendChild(document.createTextNode('bar'));

    await render(createTemplate(`<h1>Hello Glimmer!</h1>`), containerElement);

    assert.equal(containerElement.innerHTML, '<p>foo</p>bar<h1>Hello Glimmer!</h1>');
  });
});
