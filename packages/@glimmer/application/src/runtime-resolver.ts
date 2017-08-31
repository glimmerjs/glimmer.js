import {
  ModifierManager,
  Helper as GlimmerHelper,
  Invocation,
  ComponentSpec,
  Helper,
  ScannableTemplate
} from '@glimmer/runtime';
import { TemplateOptions } from '@glimmer/opcode-compiler';
import {
  unwrap
} from "@glimmer/util";
import { TypedRegistry } from "./typed-registry";
import { Opaque, RuntimeResolver as IRuntimeResolver, Option, Maybe } from "@glimmer/interfaces";
import { Owner, getOwner } from "@glimmer/di";
import { ComponentDefinition, ComponentManager } from "@glimmer/component";
import Application from "./application";

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
  cache = {
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

  compileTemplate(name: string, definition: ComponentDefinition): Invocation {
    if (!this.cache.compiledTemplate.hasName(name)) {
      let serializedTemplate = this.resolve<SerializedTemplateWithLazyBlock<Specifier>>(definition.layout);
      let { block } = serializedTemplate;
      let layout = JSON.parse(block);
      let template = new ScannableTemplate(this.templateOptions, layout).asLayout();
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

  registerComponent(name: string, resolvedSpecifier: string, Component: Opaque, template: string): number {
    let templateEntry = this.registerTemplate(resolvedSpecifier, template);
    let manager = this.managerFor(templateEntry.meta.managerId);
    let definition = new ComponentDefinition(name, manager, Component, templateEntry.handle);

    return this.register('component', name, { definition, manager: definition.manager });
  }

  lookupComponentHandle(name: string, referer?: Specifier) {
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

  registerTemplate(resolvedSpecifier: string, template: string): TemplateEntry {
    let layout:  SerializedTemplateWithLazyBlock<Specifier> = JSON.parse(template);
    return {
      name: resolvedSpecifier,
      handle: this.register('template', resolvedSpecifier, layout),
      meta: layout.meta
    };
  }

  lookupComponent(name: string, meta: Specifier): ComponentSpec {
    let handle: number;
    if (!this.cache.component.hasName(name)) {
      let specifier = unwrap(this.identifyComponent(name, meta));
      let component = this.owner.lookup(specifier, meta.specifier);
      let template = this.owner.lookup('template', specifier);

      handle = this.registerComponent(name, specifier, component, template);
    } else {
      handle = this.lookup('component', name, meta);
    }

    return this.resolve<ComponentSpec>(handle);
  }

  lookupHelper(name: string, meta?: Specifier): Option<number> {
    if (!this.cache.helper.hasName(name)) {
      let owner: Owner = getOwner(this);
      let relSpecifier = `helper:${name}`;
      let referrer: string = meta.specifier;

      let specifier = owner.identify(relSpecifier, referrer);
      if (specifier === undefined) {
        return null;
      }

      let helper = this.owner.lookup(specifier, meta.specifier);
      return this.register('helper', name, helper);
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
    let referrer: string = meta.specifier;

    let specifier = owner.identify(relSpecifier, referrer);

    if (specifier === undefined && owner.identify(`component:${name}`, referrer)) {
      throw new Error(`The component '${name}' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory.`);
    }

    return specifier;
  }

}
