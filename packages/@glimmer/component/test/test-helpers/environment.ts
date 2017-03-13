import {
  CompiledProgram,
  ComponentClass,
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment,
  EvaluatedArgs,
  Helper as GlimmerHelper,
  ModifierManager,
  PartialDefinition,
  compileLayout
} from '@glimmer/runtime';
import {
  Reference,
  RevisionTag,
  PathReference,
  OpaqueIterator,
  OpaqueIterable,
  AbstractIterable,
  IterationItem,
  VOLATILE_TAG
} from "@glimmer/reference";
import {
  Dict,
  dict,
  assign,
  initializeGuid,
  Opaque,
  FIXME
} from '@glimmer/util';
import {
  SerializedTemplateWithLazyBlock,
  TemplateMeta
} from "@glimmer/wire-format";
import {
  SymbolTable
} from '@glimmer/interfaces';
import {
  getOwner,
  setOwner,
  Owner
} from '@glimmer/di';
import Component from '../../src/component';
import ComponentDefinition from '../../src/component-definition';
import ComponentLayoutCompiler from '../../src/component-layout-compiler';
import ComponentManager from '../../src/component-manager';
import Iterable from './iterable';

type KeyFor<T> = (item: Opaque, index: T) => string;

export interface EnvironmentOptions {
  document?: HTMLDocument;
  appendOperations?: DOMTreeConstruction;
}

export default class Environment extends GlimmerEnvironment {
  private helpers = dict<GlimmerHelper>();
  private modifiers = dict<ModifierManager<Opaque>>();
  private partials = dict<PartialDefinition<{}>>();
  private components = dict<ComponentDefinition>();
  private uselessAnchor: HTMLAnchorElement;
  private componentManager: ComponentManager;
  public compiledLayouts = dict<any>();

  static create(options: EnvironmentOptions = {}) {
    options.document = options.document || self.document;
    options.appendOperations = options.appendOperations || new DOMTreeConstruction(options.document);

    return new Environment(options);
  }

  constructor(options: EnvironmentOptions) {
    super({ appendOperations: options.appendOperations, updateOperations: new DOMChanges(options.document as HTMLDocument) });

    setOwner(this, getOwner(options));

    // TODO - allow more than one component manager per environment
    this.componentManager = new ComponentManager(this);

    // TODO - required for `protocolForURL` - seek alternative approach
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor = options.document.createElement('a') as HTMLAnchorElement;
  }

  begin() {
    super.begin();
  }

  commit() {
    super.commit();
  }

  protocolForURL(url: string): string {
    // TODO - investigate alternative approaches
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor.href = url;
    return this.uselessAnchor.protocol;
  }

  registerComponent(name: string, ComponentClass: ComponentClass, template: SerializedTemplateWithLazyBlock<{}>): ComponentDefinition {
    let componentDef: ComponentDefinition = new ComponentDefinition(name, this.componentManager, ComponentClass);
    this.components[name] = componentDef;

    // TODO - allow templates to be defined on the component class itself?
    let componentLayout = this.getCompiledBlock(ComponentLayoutCompiler, template);
    this.compiledLayouts[name] = componentLayout;

    return componentDef;
  }

  hasPartial(partialName: string) {
    return partialName in this.partials;
  }

  lookupPartial(partialName: string) {
    let partial = this.partials[partialName];

    return partial;
  }

  hasComponentDefinition(name: string, symbolTable: SymbolTable): boolean {
    return !!this.getComponentDefinition(name, symbolTable);
  }

  getComponentDefinition(componentName: string, symbolTable: SymbolTable): ComponentDefinition {
    return this.components[componentName];
  }

  hasHelper(helperName: string, blockMeta: TemplateMeta) {
    return helperName.length === 1 && (helperName in this.helpers);
  }

  lookupHelper(helperName: string, blockMeta: TemplateMeta) {
    let helper = this.helpers[helperName];

    if (!helper) throw new Error(`Helper for ${helperName} not found.`);

    return helper;
  }

  hasModifier(modifierName: string, blockMeta: TemplateMeta): boolean {
    return modifierName.length === 1 && (modifierName in this.modifiers);
  }

  lookupModifier(modifierName: string, blockMeta: TemplateMeta): ModifierManager<Opaque> {
    let modifier = this.modifiers[modifierName];

    if(!modifier) throw new Error(`Modifier for ${modifierName} not found.`);
    return modifier;
  }

  iterableFor(ref: Reference<Opaque>, args: EvaluatedArgs): OpaqueIterable {
    let keyPath = args.named.get("key").value() as FIXME<any, "User value to lookup key">;
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

  // a Compiler can wrap the template so it needs its own cache
  getCompiledBlock(Compiler: any, template: SerializedTemplateWithLazyBlock<{}>): CompiledProgram {
    let compilable = new Compiler(template);
    return compileLayout(compilable, this);
  }
}
