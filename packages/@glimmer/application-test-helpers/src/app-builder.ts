import Resolver, { BasicModuleRegistry, ResolverConfiguration } from '@glimmer/resolver';
import { Dict, ModuleLocator, TemplateLocator } from '@glimmer/interfaces';
import defaultResolverConfiguration from './default-resolver-configuration';
import { precompile } from './compiler';
import Application, {
  ApplicationConstructor,
  BytecodeLoader,
  DOMBuilder,
  Loader,
  RuntimeCompilerLoader,
  SyncRenderer,
} from '@glimmer/application';
import { ComponentManager, CAPABILITIES } from '@glimmer/component';
import { assert } from '@glimmer/util';
import { BundleCompiler, CompilerDelegate as ICompilerDelegate } from '@glimmer/bundle-compiler';
import { buildAction, mainTemplate } from '@glimmer/application';
import { compilable } from '@glimmer/opcode-compiler';
import { Metadata } from '../../application/src/loaders/bytecode/loader';
import { SimpleDocument } from '@simple-dom/interface';

import didRender from './did-render';

export interface AppBuilderOptions<T> {
  appName?: string;
  loader?: string;
  ApplicationClass?: ApplicationConstructor<T>;
  ComponentManager?: any; // TODO - typing
  resolverConfiguration?: ResolverConfiguration;
  document?: SimpleDocument;
}

export interface ComponentFactory {}

export class TestApplication extends Application {
  rootElement: Element;
}

export interface AppBuilderTemplateMeta {
  specifier: string;
}

function locatorFor(module: string, name: string): TemplateLocator<ModuleLocator> {
  return {
    kind: 'template',
    module,
    name,
    meta: {
      module,
      name,
    },
  };
}

export class AppBuilder<T extends TestApplication> {
  rootName: string;
  modules: Dict<unknown> = {};
  templates: Dict<string> = {};
  options: AppBuilderOptions<T>;

  constructor(name: string, options: AppBuilderOptions<T>) {
    this.rootName = name;
    this.options = options;
    this.modules[
      `component-manager:/${this.rootName}/component-managers/main`
    ] = this.options.ComponentManager;
    this.template('Main', '<div />');
    this.helper('action', buildAction);
  }

  template(name: string, template: string) {
    assert(
      name.charAt(0) === name.charAt(0).toUpperCase(),
      'template names must start with a capital letter'
    );

    let specifier = `template:/${this.rootName}/components/${name}`;
    this.modules[specifier] = precompile(template, { meta: { specifier } });
    this.templates[specifier] = template;
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

  protected buildResolver(): Resolver {
    let resolverConfiguration = this.options.resolverConfiguration || defaultResolverConfiguration;
    resolverConfiguration.app = resolverConfiguration.app || {
      name: this.rootName,
      rootName: this.rootName,
    };

    let registry = new BasicModuleRegistry(this.modules);
    return new Resolver(resolverConfiguration, registry);
  }

  protected buildRuntimeCompilerLoader(resolver: Resolver): Loader {
    return new RuntimeCompilerLoader(resolver);
  }

  protected buildBytecodeLoader(resolver: Resolver) {
    let delegate = new CompilerDelegate(resolver);
    let compiler = new BundleCompiler(delegate);

    let mainLocator = locatorFor('template:mainTemplate', 'default');
    mainLocator.meta.module = 'template:mainTemplate';

    let block = JSON.parse(mainTemplate.block);
    let compilableTemplate = compilable({
      block,
      referrer: mainLocator.meta,
    });

    compiler.addCompilableTemplate(mainLocator, compilableTemplate);

    for (let module in this.templates) {
      compiler.addTemplateSource(locatorFor(module, 'default'), this.templates[module]);
    }

    let { heap, pool, table } = compiler.compile();

    let resolverTable: unknown[] = [];

    let meta: Dict<Metadata> = {};

    table.vmHandleByModuleLocator.forEach((vmHandle, locator) => {
      let handle = table.byModuleLocator.get(locator);
      let template = compiler.getTemplate(locator);

      meta[locator.module] = {
        v: vmHandle,
        h: handle,
        table: template.symbolTable,
      };
    });

    table.byHandle.forEach((locator, handle) => {
      let module = locator.module.replace('template:/', 'component:/');
      if (this.modules[module]) {
        if (module.indexOf('helper:') === 0) {
          resolverTable[handle] = [1, this.modules[module]];
        } else {
          resolverTable[handle] = this.modules[module];
        }
      }
    });

    let bytecode = heap.buffer;
    let data = {
      prefix: '',
      mainEntry: table.vmHandleByModuleLocator.get(mainLocator),
      pool,
      table: resolverTable,
      meta,
      heap: {
        table: heap.table,
        handle: heap.handle,
      },
    };

    return new BytecodeLoader({ bytecode, data });
  }

  async boot(): Promise<T> {
    let resolver = this.buildResolver();
    let loader: Loader;

    switch (this.options.loader) {
      case 'runtime-compiler':
        loader = this.buildRuntimeCompilerLoader(resolver);
        break;
      case 'bytecode':
        loader = this.buildBytecodeLoader(resolver);
        break;
      default:
        throw new Error(`Unrecognized loader ${this.options.loader}`);
    }

    let doc: Document = (this.options.document as Document) || document;
    let element = doc.body;
    let builder = new DOMBuilder({ element });
    let renderer = new SyncRenderer();

    let app = new this.options.ApplicationClass({
      resolver,
      builder,
      loader,
      renderer,
      rootName: this.rootName,
      document: this.options.document,
    });

    let rootElement = doc.createElement('div');
    app.rootElement = rootElement;
    app.renderComponent('Main', rootElement);
    app.boot();

    await didRender(app);

    return app;
  }
}

class CompilerDelegate implements ICompilerDelegate<ModuleLocator> {
  constructor(protected resolver: Resolver) {}

  hasComponentInScope(name: string, referrer: ModuleLocator): boolean {
    return !!this.resolver.identify(`template:${name}`, referrer.module);
  }

  resolveComponent(name: string, referrer: ModuleLocator): ModuleLocator {
    let resolved = this.resolver.identify(`template:${name}`, referrer.module);
    return { module: resolved, name: 'default' };
  }

  getComponentCapabilities() {
    return CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: ModuleLocator): boolean {
    return !!this.resolver.identify(`helper:${helperName}`, referrer.module);
  }

  resolveHelper(helperName: string, referrer: ModuleLocator): ModuleLocator {
    let resolved = this.resolver.identify(`helper:${helperName}`, referrer.module);
    return { module: resolved, name: 'default' };
  }

  hasPartialInScope(partialName: string, referrer: ModuleLocator): boolean {
    throw new Error('Method not implemented.');
  }

  resolvePartial(partialName: string, referrer: ModuleLocator): ModuleLocator {
    throw new Error('Method not implemented.');
  }

  hasModifierInScope(modifierName: string, referrer: ModuleLocator): boolean {
    throw new Error('Method not implemented.');
  }

  resolveModifier(modifierName: string, referrer: ModuleLocator): ModuleLocator {
    throw new Error('Method not implemented.');
  }
}

function buildApp<T extends TestApplication>(options: AppBuilderOptions<T> = {}): AppBuilder<T> {
  options.appName = options.appName || 'test-app';
  options.loader = options.loader || 'runtime-compiler';
  options.ComponentManager = options.ComponentManager || ComponentManager;
  options.ApplicationClass =
    options.ApplicationClass || (TestApplication as ApplicationConstructor<T>);

  return new AppBuilder(options.appName, options);
}

export { buildApp };
