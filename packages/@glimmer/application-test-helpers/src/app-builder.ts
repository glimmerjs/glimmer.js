import {
  Simple
} from '@glimmer/interfaces';
import Resolver, { BasicModuleRegistry, ResolverConfiguration } from '@glimmer/resolver';
import { Opaque, Dict, ProgramSymbolTable } from '@glimmer/interfaces';
import { FactoryDefinition } from '@glimmer/di';
import defaultResolverConfiguration from './default-resolver-configuration';
import { precompile } from './compiler';
import Application, { ApplicationConstructor, RuntimeCompilerLoader, BytecodeLoader, Loader } from '@glimmer/application';
import { ComponentManager, CAPABILITIES } from '@glimmer/component';
import { assert } from '@glimmer/util';
import { BundleCompiler, CompilerDelegate as ICompilerDelegate, ModuleLocator, TemplateLocator, ExternalModuleTable, BundleCompilationResult} from '@glimmer/bundle-compiler';
import { buildAction, mainTemplate } from '@glimmer/application';
import { SerializedTemplateBlock } from '@glimmer/wire-format';
import { CompilableTemplate, CompileOptions } from '@glimmer/opcode-compiler';
import { CompilableTemplate as ICompilableTemplate, Cursor } from '@glimmer/runtime';
import { CodeGenerator } from '@glimmer/compiler-delegates';

import { DOMBuilder, SyncRenderer } from '@glimmer/application';

export class TestCodeGenerator extends CodeGenerator {
  constructor(compilation: BundleCompilationResult, private modules: Dict<Opaque>) {
    super(compilation);
  }
  generateExternalModuleTable(table: ExternalModuleTable) {
    let resolverTable = [];

    table.byHandle.forEach((locator, handle) => {
      let component = locator.module.replace('template:/', 'component:/');
      if (this.modules[component]) {
        resolverTable[handle] = this.modules[component];
      }
    });

    return {
      code: '',
      table: resolverTable
    };
  }
}

export interface AppBuilderOptions<T> {
  appName?: string;
  loader?: string;
  ApplicationClass?: ApplicationConstructor<T>;
  ComponentManager?: any; // TODO - typing
  resolverConfiguration?: ResolverConfiguration;
  document?: Simple.Document;
}

export interface ComponentFactory extends FactoryDefinition<Opaque> {};

export class TestApplication extends Application {
  rootElement: Element;
}

export interface AppBuilderTemplateMeta {
  specifier: string;
}

function locatorFor(module: string, name: string): TemplateLocator<AppBuilderTemplateMeta> {
  return {
    kind: 'template',
    module,
    name,
    meta: {
      specifier: module
    }
  };
}

export class AppBuilder<T extends TestApplication> {
  rootName: string;
  modules: Dict<Opaque> = {};
  templates: Dict<string> = {};
  options: AppBuilderOptions<T>;

  constructor(name: string, options: AppBuilderOptions<T>) {
    this.rootName = name;
    this.options = options;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = this.options.ComponentManager;
    this.template('Main', '<div />');
    this.helper('action', buildAction);
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

    let mainLocator = locatorFor('template:mainTemplate', 'default');
    mainLocator.meta.specifier = 'template:mainTemplate';

    let compilableTemplate = CompilableTemplate.topLevel(JSON.parse(mainTemplate.block), compiler.compileOptions(mainLocator));
    compiler.addCompilableTemplate(mainLocator, compilableTemplate);

    for (let module in this.templates) {
      compiler.add(locatorFor(module, 'default'), this.templates[module]);
    }

    let compilation = compiler.compile();
    let codegen = new TestCodeGenerator(compilation, this.modules);

    let { data: dataSegment } = codegen.generateDataSegment();

    let bytecode = compilation.heap.buffer;
    let data = {
      main: compilation.table.vmHandleByModuleLocator.get(mainLocator),
      pool: dataSegment.pool,
      table: dataSegment.table,
      map: dataSegment.map,
      symbols: dataSegment.symbols,
      heap: dataSegment.heap
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

    let doc: Document = this.options.document as Document || document;
    let element = doc.body;
    let cursor = new Cursor(element, null);
    let builder = new DOMBuilder(cursor);
    let renderer = new SyncRenderer();

    let app = new this.options.ApplicationClass({
      resolver,
      builder,
      loader,
      renderer,
      rootName: this.rootName,
      document: this.options.document
    });

    let rootElement = doc.createElement('div');
    app.rootElement = rootElement;
    app.renderComponent('Main', rootElement);

    await app.boot();

    return app;
  }
}

class CompilerDelegate implements ICompilerDelegate<AppBuilderTemplateMeta> {
  constructor(protected resolver: Resolver) {
  }

  hasComponentInScope(name: string, referrer: AppBuilderTemplateMeta): boolean {
    return !!this.resolver.identify(`template:${name}`, referrer.specifier);
  }

  resolveComponent(name: string, referrer: AppBuilderTemplateMeta): ModuleLocator {
    let resolved = this.resolver.identify(`template:${name}`, referrer.specifier);
    return { module: resolved, name: 'default' };
  }

  getComponentCapabilities() {
    return CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: AppBuilderTemplateMeta): boolean {
    return !!this.resolver.identify(`helper:${helperName}`, referrer.specifier);
  }

  resolveHelper(helperName: string, referrer: AppBuilderTemplateMeta): ModuleLocator {
    let resolved = this.resolver.identify(`helper:${helperName}`, referrer.specifier);
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
