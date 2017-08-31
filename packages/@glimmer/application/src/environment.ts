import {
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment,
  ComponentSpec
} from '@glimmer/runtime';
import {
  Reference,
  OpaqueIterable
} from "@glimmer/reference";
import {
  Opaque, Option, assert,
} from '@glimmer/util';
import {
  getOwner,
  setOwner
} from '@glimmer/di';
import Iterable from './iterable';
import { Program, LazyConstants } from '@glimmer/program';
import action from './helpers/action';
import { RuntimeResolver, Specifier } from "./runtime-resolver";
import {
  TemplateOptions,
  Macros,
  CompileTimeLookup as ICompileTimeLookup,
  LazyOpcodeBuilder,
  ComponentCapabilities,
  ICompilableTemplate
} from '@glimmer/opcode-compiler';
import { ProgramSymbolTable } from '@glimmer/interfaces';

type KeyFor<T> = (item: Opaque, index: T) => string;

export interface EnvironmentOptions {
  document?: HTMLDocument;
  appendOperations?: DOMTreeConstruction;
}

class CompileTimeLookup implements ICompileTimeLookup {
  constructor(private resolver: RuntimeResolver) {}

  private getComponentSpec(handle: number): ComponentSpec {
    let spec = this.resolver.resolve<Option<ComponentSpec>>(handle);

    assert(!!spec, `Couldn't find a template named ${name}`);

    return spec!;
  }

  getCapabilities(handle: number): ComponentCapabilities {
    let spec = this.getComponentSpec(handle);
    let { manager, definition } = spec!;
    return manager.getCapabilities(definition);
  }

  getLayout(handle: number): ICompilableTemplate<ProgramSymbolTable> {
    let { manager, definition } = this.getComponentSpec(handle);
    let invocation = manager.getLayout(definition, this.resolver);

    return {
      compile() { return invocation.handle; },
      symbolTable: invocation.symbolTable
    };
  }

  lookupHelper(name: string, referer: Specifier): Option<number> {
    return this.resolver.lookupHelper(name, referer);
  }

  lookupModifier(name: string, referer: Specifier): Option<number> {
    return this.resolver.lookupModifier(name, referer);
  }

  lookupComponentSpec(name: string, referer: Specifier): Option<number> {
    return this.resolver.lookupComponentHandle(name, referer);
  }

  lookupPartial(name: string, referer: Specifier): Option<number> {
    return this.resolver.lookupPartial(name, referer);
  }
}

export default class Environment extends GlimmerEnvironment {
  private uselessAnchor: HTMLAnchorElement;
  public resolver: RuntimeResolver;
  protected program: Program;
  public compileOptions: TemplateOptions<Specifier>;

  static create(options: EnvironmentOptions = {}) {
    options.document = options.document || self.document;
    options.appendOperations = options.appendOperations || new DOMTreeConstruction(options.document);

    return new Environment(options);
  }

  constructor(options: EnvironmentOptions) {
    super({ appendOperations: options.appendOperations, updateOperations: new DOMChanges(options.document as HTMLDocument || document) });

    setOwner(this, getOwner(options));

    let resolver = this.resolver = new RuntimeResolver(getOwner(this));
    let program = this.program = new Program(new LazyConstants(resolver));
    let macros = new Macros();
    let lookup = new CompileTimeLookup(resolver);

    this.compileOptions = {
      program,
      macros,
      lookup,
      Builder: LazyOpcodeBuilder
    };

    this.resolver.setCompileOptions(this.compileOptions);
    resolver.register('helper', 'action', action);
    resolver.register('helper', 'if', ([condition, yes, no]) => condition ? yes : no);

    // TODO - required for `protocolForURL` - seek alternative approach
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor = options.document.createElement('a') as HTMLAnchorElement;
  }

  protocolForURL(url: string): string {
    // TODO - investigate alternative approaches
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor.href = url;
    return this.uselessAnchor.protocol;
  }

  iterableFor(ref: Reference<Opaque>, keyPath: string): OpaqueIterable {
    let keyFor: KeyFor<Opaque>;

    if (!keyPath) {
      throw new Error('Must specify a key for #each');
    }

    switch (keyPath) {
      case '@index':
        keyFor = (_, index: number) => String(index);
      break;
      case '@primitive':
        keyFor = (item: Opaque) => String(item);
      break;
      default:
        keyFor = (item: Opaque) => item[keyPath];
      break;
    }

    return new Iterable(ref, keyFor);
  }
}
