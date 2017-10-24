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
import { BundleCompiler, CompilerDelegate as ICompilerDelegate, Specifier, specifierFor } from '@glimmer/bundle-compiler';
import { buildAction, mainTemplate } from '@glimmer/application';
import { SerializedTemplateBlock } from '@glimmer/wire-format';
import { CompilableTemplate, CompileOptions } from '@glimmer/opcode-compiler';
import { CompilableTemplate as ICompilableTemplate } from '@glimmer/runtime';

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

export class AppBuilder<T extends TestApplication> {
  rootName: string;
  modules: Dict<Opaque> = {};
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

    let mainSpecifier = specifierFor(mainTemplate.meta.specifier, 'default');
    compiler.addCustom(mainSpecifier, JSON.parse(mainTemplate.block));

    for (let mod in this.modules) {
      let [key] = mod.split(':');

      if (key === 'template') {
        compiler.addCustom(specifierFor(mod, 'default'), JSON.parse((this.modules[mod] as any).block));
      }
    }

    let { heap, pool } = compiler.compile();

    let specifierMap = compiler.getSpecifierMap();
    let entryHandle = specifierMap.vmHandleBySpecifier.get(mainSpecifier);

    let table = [];
    let map = new Map();
    let symbols = new Map();

    for (let [spec, handle] of specifierMap.vmHandleBySpecifier.entries()) {
      map.set(spec.module, handle);
    }

    for (let [handle, mod] of specifierMap.byHandle.entries()) {
      table[handle] = mod;
    }

    for (let [spec, block] of compiler.compiledBlocks.entries()) {
      symbols.set(spec.module, { symbols: (block as SerializedTemplateBlock).symbols, hasEval: (block as SerializedTemplateBlock).hasEval });
    }

    let bytecode = heap.buffer;
    let data = {
      pool,
      table,
      map,
      symbols,
      entryHandle,
      heap: {
        table: heap.table,
        handle: heap.handle
      }
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

    let app = new this.options.ApplicationClass({
      resolver,
      loader,
      rootName: this.rootName,
      document: this.options.document
    });

    let rootElement = (app.document as Document).createElement('div');
    app.renderComponent('Main', rootElement);
    app.rootElement = rootElement;

    await app.boot();

    return app;
  }
}

class CompilerDelegate implements ICompilerDelegate {
  constructor(protected resolver: Resolver) {
  }

  hasComponentInScope(name: string, referrer: Specifier): boolean {
    return !!this.resolver.identify(`template:${name}`, referrer.module);
  }

  resolveComponentSpecifier(name: string, referrer: Specifier): Specifier {
    let resolved = this.resolver.identify(`template:${name}`, referrer.module);
    return specifierFor(resolved, 'default');
  }

  getComponentCapabilities() {
    return CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: Specifier): boolean {
    return !!this.resolver.identify(`helper:${helperName}`, referrer.module);
  }

  resolveHelperSpecifier(helperName: string, referrer: Specifier): Specifier {
    let resolved = this.resolver.identify(`helper:${helperName}`, referrer.module);
    return specifierFor(resolved, 'default');
  }

  hasPartialInScope(partialName: string, referrer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }

  resolvePartialSpecifier(partialName: string, referrer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }

  getComponentLayout(specifier: Specifier, block: SerializedTemplateBlock, options: CompileOptions<Specifier>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
  }

  hasModifierInScope(modifierName: string, referrer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }

  resolveModifierSpecifier(modifierName: string, referrer: Specifier): Specifier {
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
