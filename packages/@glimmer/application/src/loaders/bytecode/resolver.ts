import {
  Dict,
  ComponentDefinition,
  ProgramSymbolTable,
  ComponentManager,
  Helper,
  AotRuntimeResolver,
  Invocation,
} from '@glimmer/interfaces';
import { unreachable } from '@glimmer/util';
import { Owner, Factory } from '@glimmer/di';
import { CustomComponentDefinition, ComponentManager, ComponentFactory } from '../../components/component-managers/custom';
import { HelperReference, UserHelper } from '../../helpers/user-helper';
import { BytecodeMetadata } from './loader';
import { getManager } from '../../components/utils';
import { TemplateOnlyComponentDefinition, TEMPLATE_ONLY_MANAGER } from '../../components/component-managers/template-only';

export interface TemplateMeta {
  specifier: string;
}

/**
 * @internal
 */
export const enum ModuleTypes {
  HELPER_FACTORY,
  HELPER,
}

export interface TemplateLocator {
  module: string;
  name: string;
}
/**
 * Exchanges VM handles for concrete implementations.
 *
 * @internal
 */
export default class BytecodeResolver implements AotRuntimeResolver<TemplateMeta> {
  constructor(
    protected owner: Owner,
    protected table: unknown[],
    protected meta: Dict<BytecodeMetadata>,
    private prefix: string
  ) {}

  protected managers: Dict<ComponentManager<unknown, unknown>> = {};

  lookupComponent(name: string, referrer: TemplateMeta): ComponentDefinition {
    return this.lookupComponentDefinition(name, referrer);
  }

  /**
   * Supports dynamic runtime lookup of components via the `{{component}}`
   * helper. The VM invokes this hook and passes the name of the invoked
   * component along with referrer information about the containing template.
   * The resolver is responsible for returning a component definition containing
   * the VM handle and symbol table for the resolved component.
   */
  lookupComponentDefinition(name: string, referrer: TemplateMeta): ComponentDefinition {
    let owner = this.owner;
    referrer = referrer || { specifier: null };

    let templateSpecifier = owner.identify(`template:${name}`, referrer.specifier);

    if (!templateSpecifier) {
      throw new Error(
        `Could not find component '${name}', invoked using the {{component}} helper in ${
          referrer.specifier
        }`
      );
    }

    let trimmed = templateSpecifier.replace(this.prefix, '');

    if (!this.meta[trimmed]) {
      throw new Error(
        `Could not find component <${trimmed}> invoked from the <${
          referrer.specifier
        }> component. Available components are: ${Object.keys(this.meta)}`
      );
    }

    const { v: vmHandle, h: handle, sT: symbolTable } = this.meta[trimmed];
    const ComponentClass = this.table[handle];

    const componentFactory = ComponentClass && {
      class: ComponentClass as {}
    };

    return createAotComponentDefinition(
      componentFactory,
      vmHandle,
      owner,
      symbolTable as ProgramSymbolTable,
      name
    );
  }

  lookupPartial(name: string, referrer: TemplateMeta): number {
    throw unreachable();
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
          return (helper as any) as U;
        case ModuleTypes.HELPER:
          return (this.resolveHelperFactory(helper) as any) as U;
        default:
          throw new Error(`Unsupported external module table type: ${type}`);
      }
    }

    // let { v: vmHandle, sT: symbolTable, C: ComponentClass } = this.meta[value as string];

    const componentFactory = value && { class: value as {} };

    return createAotComponentDefinition(
      componentFactory
    ) as unknown as U;
  }

  resolveComponentDefinition(ComponentClass: Factory<unknown>): ComponentDefinition {
    if (!ComponentClass) {
      let definition = {
        manager: TEMPLATE_ONLY_MANAGER,
        state: { definition: null }
      };
      definition.state.definition = definition;
      return definition;
    }
  }

  resolveHelperFactory(helper: UserHelper): Helper {
    return args => new HelperReference(helper, args);
  }

  getInvocation(locator: TemplateMeta): Invocation {
    throw new Error('unimplemented getInvocation');
  }
}

export function createAotComponentDefinition(
  componentFactory: ComponentFactory,
  handle?: number,
  owner?: Owner,
  symbolTable?: ProgramSymbolTable,
  name?: string
): ComponentDefinition {
  if (!componentFactory) {
    return new TemplateOnlyComponentDefinition(name, handle, symbolTable);
  }

  const ComponentClass = componentFactory.class;
  const { factory } = getManager(ComponentClass);

  return new CustomComponentDefinition(
    name,
    componentFactory,
    factory(owner) as ComponentManager<unknown>,
    handle,
    symbolTable
  );
}
