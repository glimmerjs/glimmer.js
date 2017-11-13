import { RenderTest, test, didRender, renderModule } from "@glimmer/application-test-helpers";

class RenderComponentTest extends RenderTest {
  @test async "renders a component with bytecode loader"(assert) {
    assert.expect(1);
    let app = await this.app
      .template('HelloWorld', `<h1>Hello Glimmer!</h1>`)
      .boot();

    app.renderComponent({
      component: 'HelloWorld'
    });

    await didRender(app);
    this.assertHTML('<h1>Hello Glimmer!</h1>');
  }
}

renderModule('[@glimmer/application] renderComponent', RenderComponentTest, { loader: 'bytecode' });
