import { didRender } from '@glimmer/application-test-helpers';
import { test, RenderTest, renderModule } from '@glimmer/application-test-helpers';

import '../helpers/async';

class RenderComponentTest extends RenderTest {
  @test async "renders a component"(assert) {
    assert.expect(1);

    let containerElement = document.createElement('div');

    let app = await this.app
      .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
      .boot();

    app.renderComponent('HelloWorld', containerElement);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
  }

  @test async 'renders a component without affecting existing content'(assert) {
    assert.expect(2);

    let containerElement = document.createElement('div');
    let previousSibling = document.createElement('p');

    previousSibling.appendChild(document.createTextNode('foo'));
    containerElement.appendChild(previousSibling);
    containerElement.appendChild(document.createTextNode('bar'));

    let app = await this.app
      .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
      .boot();

    assert.equal(containerElement.innerHTML, '<p>foo</p>bar');

    app.renderComponent('HelloWorld', containerElement);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<p>foo</p>bar<h1>Hello Glimmer!</h1>');
  }

  @test async 'renders a component before a given sibling'(assert) {
    assert.expect(2);

    let containerElement = document.createElement('div');
    let previousSibling = document.createElement('p');
    let nextSibling = document.createElement('aside');

    containerElement.appendChild(previousSibling);
    containerElement.appendChild(nextSibling);

    let app = await this.app
      .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
      .boot();

    assert.equal(containerElement.innerHTML, '<p></p><aside></aside>');

    app.renderComponent('HelloWorld', containerElement, nextSibling);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<p></p><h1>Hello Glimmer!</h1><aside></aside>');
  }

  @test async 'renders multiple components in different places'(assert) {
    assert.expect(2);

    let firstContainerElement = document.createElement('div');
    let secondContainerElement = document.createElement('div');

    let app = await this.app
      .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
      .template('HelloRobbie', `<h1>Hello Robbie!</h1>`)
      .boot();

    app.renderComponent('HelloWorld', firstContainerElement);
    app.renderComponent('HelloRobbie', secondContainerElement);

    await didRender(app);

    assert.equal(firstContainerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
    assert.equal(secondContainerElement.innerHTML, '<h1>Hello Robbie!</h1>');
  }

  @test async 'renders multiple components in the same container'(assert) {
    assert.expect(1);

    let containerElement = document.createElement('div');

    let app = await this.app
      .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
      .template('HelloRobbie', `<h1>Hello Robbie!</h1>`)
      .boot();

    app.renderComponent('HelloWorld', containerElement);
    app.renderComponent('HelloRobbie', containerElement);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1><h1>Hello Robbie!</h1>');
  }

  @test async 'renders multiple components in the same container in particular places'(assert) {
    assert.expect(2);

    let containerElement = document.createElement('div');
    let nextSibling = document.createElement('aside');

    containerElement.appendChild(nextSibling);

    let app = await this.app
      .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
      .template('HelloRobbie', `<h1>Hello Robbie!</h1>`)
      .boot();

    assert.equal(containerElement.innerHTML, '<aside></aside>');

    app.renderComponent('HelloWorld', containerElement);
    app.renderComponent('HelloRobbie', containerElement, nextSibling);

    await didRender(app);

    assert.equal(containerElement.innerHTML, '<h1>Hello Robbie!</h1><aside></aside><h1>Hello Glimmer!</h1>');
  }

  @test({ debug: true })
  async 'throws an exception if an invoked component is not found'(assert) {
    assert.expect(1);

    let containerElement = document.createElement('div');

    try {
      let app = await this.app
        .template('HelloWorld', `<NonExistent />`)
        .boot();

      app.renderComponent('HelloWorld', containerElement);

      await didRender(app);
    } catch (err) {
      assert.ok(err.toString().match(/(Cannot|Could not) find (the )?component '?NonExistent'?/));
    }
  }
}

renderModule('[@glimmer/application] renderComponent', RenderComponentTest);
