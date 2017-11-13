import {
  Simple
} from '@glimmer/interfaces';
import Resolver, { BasicModuleRegistry, ResolverConfiguration } from '@glimmer/resolver';
import { Opaque, Dict, ProgramSymbolTable, ComponentCapabilities } from '@glimmer/interfaces';
import { FactoryDefinition } from '@glimmer/di';
import defaultResolverConfiguration from './default-resolver-configuration';
import { precompile } from './compiler';
import Application, { ApplicationConstructor, RuntimeCompilerLoader, BytecodeLoader, Loader } from '@glimmer/application';
import { ComponentManager, CAPABILITIES } from '@glimmer/component';
import { assert } from '@glimmer/util';
import { BundleCompiler, CompilerDelegate as ICompilerDelegate, ModuleLocator, TemplateLocator } from '@glimmer/bundle-compiler';
import { buildAction } from '@glimmer/application';
import { SerializedTemplateBlock } from '@glimmer/wire-format';
import { CompilableTemplate, CompileOptions } from '@glimmer/opcode-compiler';
import { CompilableTemplate as ICompilableTemplate, Cursor } from '@glimmer/runtime';

import { DOMBuilder, SyncRenderer } from '@glimmer/application';

export interface AppBuilderOptions<T> {
  appName?: string;
  loader?: string;
  ApplicationClass?: ApplicationConstructor<T>;
  ComponentManager?: any; // TODO - typing
  resolverConfiguration?: ResolverConfiguration;
  document?: Simple.Document;
  renderMode?: string;
}

export interface ComponentFactory extends FactoryDefinition<Opaque> {};

export class TestApplication extends Application {
  rootElement: Element;
}

export interface AppBuilderTemplateMeta {
  locator: ModuleLocator;
}

function locatorFor(module: string, name: string): TemplateLocator<AppBuilderTemplateMeta> {
  let locator = { module, name };
  return {
    kind: 'template',
    module,
    name,
    meta: {
      locator
    }
  };
}

export class AppBuilder<T extends TestApplication> {
  rootName: string;
  modules: Dict<Opaque> = {};
  templates: Dict<string> = {};
  options: AppBuilderOptions<T>;
  document: Document;

  constructor(name: string, options: AppBuilderOptions<T>) {
    this.rootName = name;
    this.options = options;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = this.options.ComponentManager;
    this.template('Main', '<div />');
    this.helper('action', buildAction);
    this.document = this.options.document as Document || document;
  }

  template(name: string, template: string) {
    assert(name.charAt(0) === name.charAt(0).toUpperCase(), 'template names must start with a capital letter');

    let specifier = `template:/${this.rootName}/components/${name}`;
    this.modules[specifier] = precompile(template, { meta: { specifier }});
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

  protected buildResolver() {
    let resolverConfiguration = this.options.resolverConfiguration || defaultResolverConfiguration;
    resolverConfiguration.app = resolverConfiguration.app || {
      name: this.rootName,
      rootName: this.rootName
    };

    let registry = new BasicModuleRegistry(this.modules);
    return new Resolver(resolverConfiguration, registry);
  }

  protected buildRuntimeCompilerLoader(resolver: Resolver) {
    return new RuntimeCompilerLoader(resolver);
  }

  protected buildBytecodeLoader(resolver: Resolver) {
    let delegate = new CompilerDelegate(resolver);
    let compiler = new BundleCompiler(delegate);
    let mainTemplateSingleRoot = precompile('{{component @componentName model=@model}}', {
      meta: { specifier: 'mainTemplate' }
    });

    let mainLocator = locatorFor(mainTemplateSingleRoot.meta.specifier, 'default');
    mainLocator.meta.locator = mainLocator;

    let compilableTemplate = CompilableTemplate.topLevel(JSON.parse(mainTemplateSingleRoot.block), compiler.compileOptions(mainLocator));
    compiler.addCompilableTemplate(mainLocator, compilableTemplate);

    for (let module in this.templates) {
      compiler.add(locatorFor(module, 'default'), this.templates[module]);
    }

    let { main, heap, pool, table } = compiler.compile();

    let resolverTable: Opaque[] = [];
    let resolverMap: Dict<number> = {};
    let resolverSymbols: Dict<ProgramSymbolTable> = {};

    table.vmHandleByModuleLocator.forEach((vmHandle, locator) => {
      resolverMap[locator.module] = vmHandle;
    });

    compiler.compilableTemplates.forEach((template, locator) => {
      resolverSymbols[locator.module] = template.symbolTable;
    });

    // table.byHandle.forEach((locator, handle) => {
    //   resolverTable[handle] = this.modules[locator.module;
    // });

    let bytecode = heap.buffer;
    let data = {
      main,
      pool,
      table: resolverTable,
      map: resolverMap,
      symbols: resolverSymbols,
      mainSpec: mainTemplateSingleRoot.meta,
      heap: {
        table: heap.table,
        handle: heap.handle
      }
    };

    return new BytecodeLoader({ bytecode, data });
  }

  rootElement() {
    let { document: doc } = this;
    doc = doc as Document;
    if (doc.getElementById && doc.getElementById('root')) {
      return doc.getElementById('root');
    }

    let element;
    if (this.options.renderMode === 'server') {
      element = doc.body;
    } else {
      element = doc.getElementById('qunit-fixture');
    }

    let root = doc.createElement('div');

    root.id = 'root';

    element.appendChild(root);

    return root;
  }

  async boot(): Promise<T> {
    let resolver = this.buildResolver();
    let loader: Loader;
    let mode = 'components';

    switch (this.options.loader) {
      case 'runtime-compiler':
        loader = this.buildRuntimeCompilerLoader(resolver);
        break;
      case 'bytecode':
        loader = this.buildBytecodeLoader(resolver);
        mode = 'application';
        break;
      default:
        throw new Error(`Unrecognized loader ${this.options.loader}`);
    }

    let element = this.rootElement();
    let cursor = new Cursor(element, null);
    let builder = new DOMBuilder(cursor);
    let renderer = new SyncRenderer();

    let app = new this.options.ApplicationClass({
      resolver,
      builder,
      loader,
      renderer,
      mode,
      rootName: this.rootName,
      document: this.options.document
    });

    app.rootElement = element;

    if (mode === 'application') {
      app.renderComponent({
        component: 'Main',
        data: {}
      });
    } else {
      app.renderComponent('Main', element);
    }

    await app.boot();

    return app;
  }
}

export class CompilerDelegate implements ICompilerDelegate<AppBuilderTemplateMeta> {
  constructor(protected resolver: Resolver) {
  }

  hasComponentInScope(name: string, referrer: AppBuilderTemplateMeta): boolean {
    return !!this.resolver.identify(`template:${name}`, referrer.locator.module);
  }

  resolveComponent(name: string, referrer: AppBuilderTemplateMeta): ModuleLocator {
    let resolved = this.resolver.identify(`template:${name}`, referrer.locator.module);
    return { module: resolved, name: 'default' };
  }

  getComponentCapabilities(): ComponentCapabilities {
    return CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: AppBuilderTemplateMeta): boolean {
    return !!this.resolver.identify(`helper:${helperName}`, referrer.locator.module);
  }

  resolveHelper(helperName: string, referrer: AppBuilderTemplateMeta): ModuleLocator {
    let resolved = this.resolver.identify(`helper:${helperName}`, referrer.locator.module);
    return { module: resolved, name: 'default' };
  }

  hasPartialInScope(partialName: string, referrer: AppBuilderTemplateMeta): boolean {
    throw new Error("Method not implemented.");
  }

  resolvePartial(partialName: string, referrer: AppBuilderTemplateMeta): ModuleLocator {
    throw new Error("Method not implemented.");
  }

  getComponentLayout(_meta: AppBuilderTemplateMeta, block: SerializedTemplateBlock, options: CompileOptions<AppBuilderTemplateMeta>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
  }

  hasModifierInScope(modifierName: string, referrer: AppBuilderTemplateMeta): boolean {
    throw new Error("Method not implemented.");
  }

  resolveModifier(modifierName: string, referrer: AppBuilderTemplateMeta): ModuleLocator {
    throw new Error("Method not implemented.");
  }
}

function buildApp<T extends TestApplication>(options: AppBuilderOptions<T> = {}): AppBuilder<T> {
  options.appName = options.appName || 'test-app';
  options.loader = options.loader || 'runtime-compiler';
  options.ComponentManager = options.ComponentManager || ComponentManager;
  options.ApplicationClass = options.ApplicationClass || TestApplication as ApplicationConstructor<T>;

  return new AppBuilder(options.appName, options);
}

export { buildApp };
