import { RuntimeResolver, ComponentDefinition, ProgramSymbolTable } from '@glimmer/interfaces';
import { unreachable, Opaque, Dict } from '@glimmer/util';
import { ComponentManager, Helper, VM, Arguments } from '@glimmer/runtime';
import { Owner, Factory } from '@glimmer/di';
import { CAPABILITIES } from '@glimmer/component';
import Application from '../../application';
import { HelperReference, UserHelper } from '../../helpers/user-helper';
import { Metadata } from './loader';

function buildComponentDefinition(ComponentClass: Factory<Opaque>, manager: ComponentManager<Opaque, Opaque>, handle?: number, symbolTable?: ProgramSymbolTable) {
  return {
    manager,
    state: {
      handle,
      symbolTable,
      ComponentClass,
      capabilities: CAPABILITIES
    }
  };
}

export interface TemplateMeta {
  specifier: string;
}

/**
 * @internal
 */
export const enum ModuleTypes {
  HELPER_FACTORY,
  HELPER
};

export interface TemplateLocator {
  module: string;
  name: string;
}
/**
 * Exchanges VM handles for concrete implementations.
 *
 * @internal
 */
export default class BytecodeResolver implements RuntimeResolver<TemplateMeta> {
  constructor(protected owner: Owner, protected table: Opaque[], protected meta: Dict<Metadata>, private prefix: string) {
  }

  protected managers: Dict<ComponentManager<Opaque, Opaque>> = {};

  /**
   * Supports dynamic runtime lookup of components via the `{{component}}`
   * helper. The VM invokes this hook and passes the name of the invoked
   * component along with referrer information about the containing template.
   * The resolver is responsible for returning a component definition containing
   * the VM handle and symbol table for the resolved component.
   */
  lookupComponentDefinition(name: string, referrer: TemplateMeta): ComponentDefinition {
    let owner = this.owner;
    let manager = this.managerFor();

    let templateSpecifier = owner.identify(`template:${name}`, referrer.specifier);

    if (!templateSpecifier) {
      throw new Error(`Could not find component '${name}', invoked using the {{component}} helper in ${referrer.specifier}`);
    }

    let trimmed = templateSpecifier.replace(this.prefix, '');
    let { v: vmHandle, h: handle, table: symbolTable } = this.meta[trimmed];

    let ComponentClass = this.table[handle] as Factory<Opaque> || null;

    return buildComponentDefinition(ComponentClass, manager, vmHandle, symbolTable);
  }

  lookupPartial(name: string, referrer: TemplateMeta): number {
    throw unreachable();
  }

  managerFor(managerId = 'main'): ComponentManager<Opaque, Opaque> {
    let manager = this.managers[managerId];

    if (manager) {
      return manager;
    }

    let { rootName } = this.owner as Application;
    manager = this.owner.lookup(`component-manager:/${rootName}/component-managers/${managerId}`);

    if (!manager) {
      throw new Error(`No component manager found for ID ${managerId}.`);
    }
    this.managers[managerId] = manager;

    return manager;
  }

  /**
   * Resolves a numeric handle into a concrete object from the external module
   * table. The VM calls this while executing binary bytecode to exchange
   * handles for live objects like component classes or helper functions.
   *
   * Because helpers are opaque, anything other than component classes in the
   * external module table is encoded as a tuple with the type information as
   * the first member.
   */
  resolve<U>(handle: number): U {
    let value = this.table[handle];

    if (Array.isArray(value)) {
      let [type, helper] = value;
      switch (type) {
        case ModuleTypes.HELPER_FACTORY:
          return helper as any as U;
        case ModuleTypes.HELPER:
         return this.resolveHelperFactory(helper) as any as U;
        default:
          throw new Error(`Unsupported external module table type: ${type}`);
      }
    }

    return this.resolveComponentDefinition(value as Factory<Opaque>) as any as U;
  }

  resolveComponentDefinition(ComponentClass: Factory<Opaque>): ComponentDefinition {
    let manager = this.managerFor();
    return buildComponentDefinition(ComponentClass, manager);
  }

  resolveHelperFactory(helper: UserHelper): Helper {
    return (_vm: VM, args: Arguments) => new HelperReference(helper, args);
  }
}
