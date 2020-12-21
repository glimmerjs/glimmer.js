import { createTemplate } from '@glimmer/core';

import { test, render } from '../utils';

QUnit.module(`[@glimmer/core] interactive rendering tests`, () => {
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

  test('rehydrates a component from existing markup when rehydrate option is set', async (assert) => {
    const containerElement = document.createElement('div');
    containerElement.innerHTML =
      '<!--%+b:0%--><!--%+b:1%--><h1>Hello World</h1><!--%-b:1%--><!--%-b:0%-->';

    await render(createTemplate(`<h1>Hello World</h1>`), {
      element: containerElement,
      rehydrate: true,
    });

    assert.equal(containerElement.innerHTML, '<h1>Hello World</h1>');
  });

  test('can partially rehydrate from a different root dom node', async (assert) => {
    const containerElement = document.createElement('div');
    containerElement.innerHTML =
      '<!--%+b:0%--><!--%+b:1%--><div id="test"><!--%+b:2%--><h1>Hello <!--%+b:3%-->World<!--%-b:3%--></h1><!--%-b:2%--></div><!--%-b:1%--><!--%-b:0%-->';

    await render(createTemplate(`<h1>Hello {{@name}}</h1>`), {
      element: containerElement.querySelector('#test')!,
      rehydrate: true,
      args: {
        name: 'World',
      },
    });

    assert.equal(
      containerElement.innerHTML,
      '<!--%+b:0%--><!--%+b:1%--><div id="test"><h1>Hello World</h1></div><!--%-b:1%--><!--%-b:0%-->'
    );
  });
});
