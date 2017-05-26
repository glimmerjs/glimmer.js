import {
  Simple
} from '@glimmer/runtime';
import Resolver, { BasicModuleRegistry, ResolverConfiguration } from '@glimmer/resolver';
import { Opaque, Dict } from '@glimmer/interfaces';
import { FactoryDefinition } from '@glimmer/di';
import defaultResolverConfiguration from './default-resolver-configuration';
import { precompile } from './compiler';

export interface Application {
  rootElement: Simple.Element;
  document: Simple.Document;
  renderComponent: Function;
  boot(): void;
  scheduleRerender(): Promise<void>;
}

export interface AppBuilderOptions {
  ApplicationClass?: any; // TODO - typing
  ComponentManager?: any; // TODO - typing
  resolverConfiguration?: ResolverConfiguration;
  document?: Simple.Document;
}

export interface ComponentFactory extends FactoryDefinition<Opaque> {};

export class AppBuilder {
  rootName: string;
  modules: Dict<Opaque> = {};
  options: AppBuilderOptions;

  constructor(name: string, options: AppBuilderOptions) {
    this.rootName = name;
    this.options = options;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = this.options.ComponentManager;
    this.template('main', '<div />');
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

  helper(name: string, helperFunc: Function) {
    let specifier = `helper:/${this.rootName}/components/${name}`;
    this.modules[specifier] = helperFunc;
    return this;
  }

  boot() {
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

    let rootElement = app.document.createElement('div');

    app.rootElement = rootElement;
    app.renderComponent('main', rootElement, null);

    app.boot();

    return app;
  }
}
