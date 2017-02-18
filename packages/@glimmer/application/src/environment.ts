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
import Component, {
  ComponentFactory,
  ComponentDefinition,
  ComponentLayoutCompiler,
  ComponentManager
} from '@glimmer/component';
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

  registerComponent(specifier: string): ComponentDefinition {
    let owner: Owner = getOwner(this);
    let ComponentClass = owner.factoryFor(specifier);
    let componentDef: ComponentDefinition = new ComponentDefinition(specifier, this.componentManager, ComponentClass);
    this.components[specifier] = componentDef;

    // TODO - allow templates to be defined on the component class itself?
    let componentTemplate = owner.lookup('template', specifier);
    let componentLayout = this.getCompiledBlock(ComponentLayoutCompiler, componentTemplate);
    this.compiledLayouts[specifier] = componentLayout;

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

  getComponentDefinition(name: string[], symbolTable: SymbolTable): ComponentDefinition {
    let owner: Owner = getOwner(this);
    let relSpecifier: string = `component:${name.join('/')}`;
    let referrer: string = symbolTable.getMeta().specifier;
    let specifier = owner.identify(relSpecifier, referrer);

    if (!this.components[specifier]) {
      this.registerComponent(specifier);
    }

    return this.components[specifier];
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
    // TODO - add caching (see environment.js in Ember)
    let compilable = new Compiler(template);
    return compileLayout(compilable, this);
  }
}
