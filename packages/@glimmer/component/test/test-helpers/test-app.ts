import Application from '@glimmer/application';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';

import ComponentManager from '../../src/component-manager';
import { precompile } from './compiler';
import { ComponentFactory } from '../../src/component';
import { setPropertyDidChange } from '../../src/tracked';

export default function buildApp(appName: string = 'test-app') {
  return new AppBuilder(appName);
}

export class TestApplication extends Application {
  rootElement: Element;
}

let moduleConfiguration = {
  types: {
    application: { definitiveCollection: 'main' },
    component: { definitiveCollection: 'components' },
    renderer: { definitiveCollection: 'main' },
    service: { definitiveCollection: 'services' },
    template: { definitiveCollection: 'components' },
    util: { definitiveCollection: 'utils' },
    'component-manager': { definitiveCollection: 'component-managers' }
  },
  collections: {
    main: {
      types: ['application', 'renderer']
    },
    components: {
      group: 'ui',
      types: ['component', 'template']
    },
    services: {
      types: ['service']
    },
    'component-managers': {
      types: ['component-manager']
    }
  }
};

export class AppBuilder {
  rootName: string;
  modules: any = {}

  constructor(name: string) {
    this.rootName = name;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = ComponentManager;
  }

  template(name: string, template: string) {
    let specifier = `template:/${this.rootName}/components/${name}`;
    this.modules[specifier] = precompile(template, { meta: { specifier, '<template-meta>': true }});
    return this;
  }

  component(name: string, componentFactory: ComponentFactory) {
    let specifier = `component:/${this.rootName}/components/${name}`;
    this.modules[specifier] = componentFactory;
    return this;
  }

  boot() {
    let resolverConfiguration = {
      app: { name: 'test-app', rootName: 'test-app' },
      types: moduleConfiguration.types,
      collections: moduleConfiguration.collections
    };

    let registry = new BasicModuleRegistry(this.modules);
    let resolver = new Resolver(resolverConfiguration, registry);
    let rootElement = document.createElement('div');

    let app = new TestApplication({
      rootName: this.rootName,
      resolver
    });

    app.rootElement = rootElement;
    app.renderComponent('main', rootElement, null);

    setPropertyDidChange(function() {
      app.scheduleRerender();
    });

    app.boot();

    return app;
  }
}
