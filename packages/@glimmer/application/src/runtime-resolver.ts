import {
  ModifierManager,
  Helper as GlimmerHelper,
  Invocation,
  ComponentSpec,
  Helper,
  ScannableTemplate,
  VM,
  Arguments
} from '@glimmer/runtime';
import { TemplateOptions } from '@glimmer/opcode-compiler';
import {
  unwrap
} from "@glimmer/util";
import { TypedRegistry } from "./typed-registry";
import { Opaque, RuntimeResolver as IRuntimeResolver, Option, Maybe, Dict } from "@glimmer/interfaces";
import { Owner, getOwner, Factory } from "@glimmer/di";
import Component, { ComponentDefinition, ComponentManager } from "@glimmer/component";
import Application from "./application";

export type UserHelper = (args: ReadonlyArray<Opaque>, named: Dict<Opaque>) => Opaque;

export interface Lookup {
  helper: GlimmerHelper;
  modifier: ModifierManager;
  component: ComponentSpec;
  template: SerializedTemplateWithLazyBlock<Specifier>;
  manager: ComponentManager;
  compiledTemplate: Invocation;
}

export type LookupType = keyof Lookup;

export interface Specifier {
  specifier: string;
  managerId?: string;
};

export type TemplateEntry = {
  handle: number;
  name: string;
  meta: Specifier;
};

export type SerializedTemplateBlockJSON = string;

export interface SerializedTemplateWithLazyBlock<Specifier> {
  id?: Option<string>;
  block: SerializedTemplateBlockJSON;
  meta: Specifier;
}

export class RuntimeResolver implements IRuntimeResolver<Specifier> {
  templateOptions: TemplateOptions<Specifier>;
  handleLookup: TypedRegistry<Opaque>[] = [];
  private cache = {
    component: new TypedRegistry<ComponentSpec>(),
    template: new TypedRegistry<SerializedTemplateWithLazyBlock<Specifier>>(),
    compiledTemplate: new TypedRegistry<Invocation>(),
    helper: new TypedRegistry<Helper>(),
    manager: new TypedRegistry<ComponentManager>(),
    modifier: new TypedRegistry<ModifierManager>()
  };

  constructor(private owner: Owner) {}

  setCompileOptions(compileOptions: TemplateOptions<Specifier>) {
    this.templateOptions = compileOptions;
  }

  lookup(type: LookupType, name: string, referer?: Specifier): Option<number> {
    if (this.cache[type].hasName(name)) {
      return this.cache[type].getHandle(name);
    } else {
      return null;
    }
  }

  register<K extends LookupType>(type: K, name: string, value: Lookup[K]): number {
    let registry = this.cache[type];
    let handle = this.handleLookup.length;
    this.handleLookup.push(registry);
    (this.cache[type] as TypedRegistry<any>).register(handle, name, value);
    return handle;
  }

  lookupModifier(name: string, meta?: Specifier): Option<number> {
    let handle = this.lookup('modifier', name);

    if (handle === null) {
      throw new Error(`Modifier for ${name} not found.`);
    }

    return handle;
  }

  compileTemplate(definition: ComponentDefinition): Invocation {
    let { name } = definition;
    if (!this.cache.compiledTemplate.hasName(name)) {
      let serializedTemplate = this.resolve<SerializedTemplateWithLazyBlock<Specifier>>(definition.layout);
      let { block, meta, id } = serializedTemplate;
      let parsedBlock = JSON.parse(block);
      let template = new ScannableTemplate(this.templateOptions, { id, block: parsedBlock, referer: meta }).asLayout();
      let invocation = {
        handle: template.compile(),
        symbolTable: template.symbolTable
      };

      this.register('compiledTemplate', name, invocation);
      return invocation;
    }

    let handle = this.lookup('compiledTemplate', name);
    return this.resolve<Invocation>(handle);
  }

  registerHelper(name: string, helper: UserHelper) {
    let glimmerHelper = (_vm: VM, args: Arguments) => new HelperReference(helper, args);
    return this.register('helper', name, glimmerHelper);
  }

  registerInternalHelper(name: string, helper: GlimmerHelper) {
    this.register('helper', name, helper);
  }

  registerComponent(name: string, resolvedSpecifier: string, Component: Component, template: SerializedTemplateWithLazyBlock<Specifier>): number {
    let templateEntry = this.registerTemplate(resolvedSpecifier, template);
    let manager = this.managerFor(templateEntry.meta.managerId);
    let definition = new ComponentDefinition(name, manager, Component, templateEntry.handle);

    return this.register('component', name, { definition, manager: definition.manager });
  }

  lookupComponentHandle(name: string, referer?: Specifier) {
    if (!this.cache.component.hasName(name)) {
      this.lookupComponent(name, referer);
    }
    return this.lookup('component', name, referer);
  }

  managerFor(managerId = 'main'): ComponentManager {
    let manager: ComponentManager;

    if (!this.cache.manager.hasName(managerId)) {
      let { rootName } = this.owner as Application;
      manager = this.owner.lookup(`component-manager:/${rootName}/component-managers/${managerId}`);
      if (!manager) {
        throw new Error(`No component manager found for ID ${managerId}.`);
      }
      this.register('manager', managerId, manager);
      return manager;
    } else {
      let handle = this.cache.manager.getHandle(managerId);
      return this.cache.manager.getByHandle(handle);
    }
  }

  registerTemplate(resolvedSpecifier: string, template: SerializedTemplateWithLazyBlock<Specifier> ): TemplateEntry {
    return {
      name: resolvedSpecifier,
      handle: this.register('template', resolvedSpecifier, template),
      meta: template.meta
    };
  }

  lookupComponent(name: string, meta: Specifier): ComponentSpec {
    let handle: number;
    if (!this.cache.component.hasName(name)) {
      let specifier = unwrap(this.identifyComponent(name, meta));
      let template = this.owner.lookup('template', specifier);
      let componentSpecifier = this.owner.identify('component', specifier);
      let componentFactory: Factory<Component> = null;

      if (componentSpecifier !== undefined) {
        componentFactory = this.owner.factoryFor(componentSpecifier);
      } else {
        componentFactory = {
          class: Component,
          create(injections) {
            return Component.create(injections);
          }
        };
      }

      handle = this.registerComponent(name, specifier, componentFactory, template);
    } else {
      handle = this.lookup('component', name, meta);
    }

    return this.resolve<ComponentSpec>(handle);
  }

  lookupHelper(name: string, meta?: Specifier): Option<number> {
    if (!this.cache.helper.hasName(name)) {
      let owner: Owner = this.owner;
      let relSpecifier = `helper:${name}`;
      let referrer: string = meta.specifier;

      let specifier = owner.identify(relSpecifier, referrer);
      if (specifier === undefined) {
        return null;
      }

      let helper = this.owner.lookup(specifier, meta.specifier);
      return this.registerHelper(name, helper);
    }

    return this.lookup('helper', name, meta);
  }

  lookupPartial(name: string, meta?: Specifier): never {
    throw new Error("Partials are not available in Glimmer applications.");
  }

  resolve<T>(handle: number): T {
    let registry = this.handleLookup[handle];
    return registry.getByHandle(handle) as T;
  }

  private identifyComponent(name: string, meta: Specifier): Maybe<string> {
    let owner: Owner = this.owner;
    let relSpecifier = `template:${name}`;
    // let referrer: string = meta.specifier;

    let specifier = owner.identify(relSpecifier, undefined);

    if (specifier === undefined && owner.identify(`component:${name}`, undefined)) {
      throw new Error(`The component '${name}' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory.`);
    }

    return specifier;
  }

}
