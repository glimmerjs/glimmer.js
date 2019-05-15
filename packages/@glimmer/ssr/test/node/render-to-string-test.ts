import { test, RenderTest, renderModule } from '@glimmer/application-test-helpers';
import Component from '@glimmer/component';
import { SET_INTERNAL_DYNAMIC_SCOPE } from '@glimmer/ssr';

class RenderToStringTest extends RenderTest {
  @test async 'renders a component'(assert: Assert) {
    assert.expect(1);
    let app = this.app
      .template('HelloWorld', `<h1>Hello {{@name}} World</h1>`);

    const html = await app.renderToString('HelloWorld', { name: 'SSR' });
    assert.equal(html, '<h1>Hello SSR World</h1>');
  }

  @test async 'renders nested components'(assert: Assert) {
    assert.expect(1);
    let app = this.app
      .template('A', 'A')
      .template('HelloWorld', `<h1>Hello <A/> {{@name}} World</h1>`);

    const html = await app.renderToString('HelloWorld', { name: 'Nested' });
    assert.equal(html, '<h1>Hello A Nested World</h1>');
  }

  @test async 'renders components with js'(assert: Assert) {
    assert.expect(1);

    class HelloWorld extends Component {
      get world() {
        return 'JS World';
      }
    }

    let app = this.app
      .component('HelloWorld', HelloWorld)
      .template('HelloWorld', `<h1>Hello {{@name}} {{world}}</h1>`);

    const html = await app.renderToString('HelloWorld', { name: 'SSR' });
    assert.equal(html, '<h1>Hello SSR JS World</h1>');
  }

  @test async 'renders components with the component helper'(assert: Assert) {
    assert.expect(1);

    let app = this.app
      .template('Name', 'name: {{@name}}')
      .template('HelloWorld', `<h1>Hello {{component "Name" name=@name}} World</h1>`);

    const html = await app.renderToString('HelloWorld', { name: 'SSR' });
    assert.equal(html, '<h1>Hello name: SSR World</h1>');
  }

  @test async 'throws an exception if an invoked component is not found'(assert: Assert) {
    assert.expect(1);

    try {
      await this.app.renderToString('NonExistent', {});
    } catch(err) {
      assert.ok(err.toString().match(/Could not find (the )?component 'NonExistent'/));
    }
  }

  @test async 'dynamic scope can be passed in'(assert: Assert) {
    assert.expect(1);

    let app = this.app
      .template('HelloWorld', `<h1>Hello {{-get-dynamic-var "name"}} World</h1>`);

    const html = await app.renderToString('HelloWorld', {}, {
      [SET_INTERNAL_DYNAMIC_SCOPE]: {name: 'dynamicScope SSR'}
    });
    assert.equal(html, '<h1>Hello dynamicScope SSR World</h1>');
  }
}

renderModule('[@glimmer/ssr] renderToString', RenderToStringTest);
