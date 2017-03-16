import {
  ComponentClass,
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment,
  Helper as GlimmerHelper,
  ModifierManager,
  PartialDefinition,
  Simple,
  compileLayout,
  CompiledDynamicProgram,
  templateFactory,
  ComponentDefinition,
  Component,
  ComponentManager,
  Template
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
import { SerializedTemplate, SerializedTemplateWithLazyBlock } from '@glimmer/wire-format';
import {
  getOwner,
  setOwner,
  Owner,
  Factory
} from '@glimmer/di';
import Iterable from './iterable';
import TemplateMeta from './template-meta';
import ComponentDefinitionCreator from './component-definition-creator'

type KeyFor<T> = (item: Opaque, index: T) => string;

export interface EnvironmentOptions {
  document?: HTMLDocument;
  appendOperations?: DOMTreeConstruction;
}

class DefaultComponentDefinition extends ComponentDefinition<any> {

}



export default class Environment extends GlimmerEnvironment {
  private helpers = dict<GlimmerHelper>();
  private modifiers = dict<ModifierManager<Opaque>>();
  private components = dict<ComponentDefinition<Component>>();
  private componentManagers = dict<ComponentManager<Component>>();
  private defaultComponentManager: ComponentManager<Component>;
  private uselessAnchor: HTMLAnchorElement;

  static create(options: EnvironmentOptions = {}) {
    options.document = options.document || self.document;
    options.appendOperations = options.appendOperations || new DOMTreeConstruction(options.document);

    return new Environment(options);
  }

  constructor(options: EnvironmentOptions) {
    super({ appendOperations: options.appendOperations, updateOperations: new DOMChanges(options.document as HTMLDocument) });

    setOwner(this, getOwner(options));

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

  hasPartial() {
    return false;
  }

  lookupPartial(): any {
  }

  registerComponentManager(manager: ComponentManager<Component>, identifier: string, isDefaultComponentManager = false) {
    this.componentManagers[identifier] = manager;
    if (isDefaultComponentManager) {
      this.defaultComponentManager = manager;
    }
  }

  hasComponentDefinition(name: string, meta: TemplateMeta): boolean {
    return !!this.getComponentDefinition(name, meta);
  }

  getComponentDefinition(name: string, meta: TemplateMeta): ComponentDefinition<Component> {
    let owner: Owner = getOwner(this);
    let relSpecifier: string = `component:${name}`;
    let referrer: string = meta.specifier;

    let specifier = owner.identify(relSpecifier, referrer);

    if (!this.components[specifier]) {
      return this.registerComponent(name, specifier, meta, owner);
    }

    return this.components[specifier];
  }

  registerComponent(name: string, componentSpecifier: string, meta: TemplateMeta, owner: Owner): ComponentDefinition<Component> {
    let componentFactory: Factory<Component> = owner.factoryFor(componentSpecifier);
    let serializedTemplate = owner.lookup('template', componentSpecifier);
    let template = templateFactory<TemplateMeta>(serializedTemplate).create(this);

    let manager: ComponentManager<Component> | ComponentDefinitionCreator = meta.managerId ? this.componentManagers[meta.managerId] : this.defaultComponentManager;
    let definition: ComponentDefinition<Component>;

    if (canCreateComponentDefinition(manager)) {
      definition = manager.createComponentDefinition(name, template, componentFactory);
    } else {
      definition = new DefaultComponentDefinition(name, manager, componentFactory);
    }

    this.components[name] = definition;

    return definition;
  }

  hasHelper(helperName: string, blockMeta: TemplateMeta) {
    return helperName.length === 1 && (helperName in this.helpers);
  }

  lookupHelper(helperName: string, blockMeta: TemplateMeta) {
    let name = helperName[0];

    let helper = this.helpers[name];

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

function canCreateComponentDefinition(manager: ComponentDefinitionCreator | ComponentManager<Component>): manager is ComponentDefinitionCreator {
  return (manager as ComponentDefinitionCreator).createComponentDefinition !== undefined;
}