import {
  CompiledBlock,
  ComponentClass,
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment,
  EvaluatedArgs,
  Helper as GlimmerHelper,
  ModifierManager,
  PartialDefinition,
  Simple,
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
import ComponentFactory from '../../src/component-factory';
import ComponentDefinition from '../../src/component-definition';
import ComponentLayoutCompiler from '../../src/component-layout-compiler';
import ComponentManager from '../../src/component-manager';
import Iterable from './iterable';

type KeyFor<T> = (item: Opaque, index: T) => string;

export interface EnvironmentOptions {
  document?: Simple.Document;
  appendOperations?: DOMTreeConstruction;
}

export default class Environment extends GlimmerEnvironment {
  private helpers = dict<GlimmerHelper>();
  private modifiers = dict<ModifierManager<Opaque>>();
  private partials = dict<PartialDefinition<{}>>();
  private components = dict<ComponentDefinition>();
  private uselessAnchor: Simple.HTMLAnchorElement;
  private componentManager: ComponentManager;
  public compiledLayouts = dict<any>();

  static create(options: EnvironmentOptions = {}) {
    options.document = options.document || self.document;
    options.appendOperations = options.appendOperations || new DOMTreeConstruction(options.document);

    return new Environment(options);
  }

  constructor(options: EnvironmentOptions) {
    super({ appendOperations: options.appendOperations, updateOperations: new DOMChanges(options.document as Simple.Document) });

    setOwner(this, getOwner(options));

    // TODO - allow more than one component manager per environment
    this.componentManager = new ComponentManager(this);

    // TODO - required for `protocolForURL` - seek alternative approach
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor = options.document.createElement('a') as Simple.HTMLAnchorElement;
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

  registerComponent(name: string, ComponentClass: ComponentClass, template: string): ComponentDefinition {
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

  hasComponentDefinition(name: string[], symbolTable: SymbolTable): boolean {
    return !!this.getComponentDefinition(name, symbolTable);
  }

  getComponentDefinition(componentName: string[], symbolTable: SymbolTable): ComponentDefinition {
    let name = componentName[0];

    return this.components[name];
  }

  hasHelper(helperName: string[], blockMeta: TemplateMeta) {
    return helperName.length === 1 && (<string>helperName[0] in this.helpers);
  }

  lookupHelper(helperName: string[], blockMeta: TemplateMeta) {
    let name = helperName[0];

    let helper = this.helpers[name];

    if (!helper) throw new Error(`Helper for ${helperName.join('.')} not found.`);

    return helper;
  }

  hasModifier(modifierName: string[], blockMeta: TemplateMeta): boolean {
    return modifierName.length === 1 && (<string>modifierName[0] in this.modifiers);
  }

  lookupModifier(modifierName: string[], blockMeta: TemplateMeta): ModifierManager<Opaque> {
    let [name] = modifierName;

    let modifier = this.modifiers[name];

    if(!modifier) throw new Error(`Modifier for ${modifierName.join('.')} not found.`);
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
  getCompiledBlock(Compiler: any, template: string): CompiledBlock {
    let compilable = new Compiler(template);
    return compileLayout(compilable, this);
  }
}
