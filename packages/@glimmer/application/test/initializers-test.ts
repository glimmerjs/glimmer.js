import Application, { RuntimeCompilerLoader, DOMBuilder, SyncRenderer } from '@glimmer/application';
import { BlankResolver } from '@glimmer/test-utils';
import createHTMLDocument from '@simple-dom/document';

const { module, test } = QUnit;

module('[@glimmer/application] Application InstanceInitializers');

class Component {
  static create() {
    return new Component();
  }
}

test('instance initializers run at initialization', function(assert) {
  let resolver = new BlankResolver();
  let element = createHTMLDocument().body;
  let app = new Application({
    rootName: 'app',
    loader: new RuntimeCompilerLoader(resolver),
    builder: new DOMBuilder({ element }),
    renderer: new SyncRenderer(),
    resolver,
  });
  app.registerInitializer({
    initialize(app) {
      app.register('component:/my-app/components/my-component', Component);
    },
  });

  app.initialize();

  assert.ok(app.lookup('component:/my-app/components/my-component'));
  assert.ok(app.lookup('component:/my-app/components/my-component') instanceof Component);
});
