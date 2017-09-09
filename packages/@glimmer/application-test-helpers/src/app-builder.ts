import {
  Simple
} from '@glimmer/interfaces';
import Resolver, { BasicModuleRegistry, ResolverConfiguration } from '@glimmer/resolver';
import { Opaque, Dict } from '@glimmer/interfaces';
import { FactoryDefinition } from '@glimmer/di';
import defaultResolverConfiguration from './default-resolver-configuration';
import { precompile } from './compiler';
import Application, { ApplicationConstructor } from '@glimmer/application';
import { ComponentManager } from '@glimmer/component';

export interface AppBuilderOptions<T> {
  ApplicationClass?: ApplicationConstructor<T>;
  ComponentManager?: any; // TODO - typing
  resolverConfiguration?: ResolverConfiguration;
  document?: Simple.Document;
}

export interface ComponentFactory extends FactoryDefinition<Opaque> {};

export class TestApplication extends Application {
  rootElement: Element;
}

export class AppBuilder<T extends TestApplication> {
  rootName: string;
  modules: Dict<Opaque> = {};
  options: AppBuilderOptions<T>;

  constructor(name: string, options: AppBuilderOptions<T>) {
    this.rootName = name;
    this.options = options;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = this.options.ComponentManager;
    this.template('Main', '<div />');
  }

  template(name: string, template: string) {
    let specifier = `template:/${this.rootName}/components/${name}`;
    this.modules[specifier] = precompile(template, { meta: { specifier }});
    return this;
  }

  component(name: string, componentFactory: ComponentFactory) {
    let specifier = `component:/${this.rootName}/components/${name}`;
    this.modules[specifier] = componentFactory;
    return this;
  }

  helper(name: string, helperFunc: Function) {
    let specifier = `helper:/${this.rootName}/components/${name}`;
    this.modules[specifier] = helperFunc;
    return this;
  }

  boot(): T {
    let resolverConfiguration = this.options.resolverConfiguration || defaultResolverConfiguration;
    resolverConfiguration.app = resolverConfiguration.app || {
      name: this.rootName,
      rootName: this.rootName
    };

    let registry = new BasicModuleRegistry(this.modules);
    let resolver = new Resolver(resolverConfiguration, registry);

    let app = new this.options.ApplicationClass({
      rootName: this.rootName,
      resolver,
      document: this.options.document
    });

    let rootElement = (app.document as Document).createElement('div');
    app.renderComponent('Main', rootElement);
    app.rootElement = rootElement;

    app.boot();

    return app;
  }
}

function buildApp<T extends TestApplication>(appName = 'test-app', options: AppBuilderOptions<T> = {}): AppBuilder<T> {
  options.ComponentManager = options.ComponentManager || ComponentManager;
  options.ApplicationClass = options.ApplicationClass || TestApplication as ApplicationConstructor<T>;

  return new AppBuilder(appName, options);
}

export { buildApp };
