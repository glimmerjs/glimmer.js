import {
  RuntimeResolver as VMRuntimeResolver,
  CompileTimeResolver as VMCompileTimeResolver,
  Option,
  InternalComponentManager,
  PartialDefinition,
  ResolvedComponentDefinition,
} from '@glimmer/interfaces';

///////////

/**
 * Resolution for non built ins is now handled by the vm as we are using strict mode
 */
export class RuntimeResolver implements VMRuntimeResolver {
  lookupComponent(
    _name: string,
    _owner: object
  ): Option<
    ResolvedComponentDefinition<object, unknown, InternalComponentManager<unknown, object>>
  > {
    return null;
  }
  lookupPartial(_name: string, _owner: object): Option<PartialDefinition> {
    return null;
  }
}

///////////

/**
 * Resolution for non built ins is now handled by the vm as we are using strict mode
 */
export class CompileTimeResolver implements VMCompileTimeResolver {
  lookupHelper(_name: string, _owner: object): Option<object> {
    return null;
  }

  lookupModifier(_name: string, _owner: object): Option<object> {
    return null;
  }

  lookupComponent(
    _name: string,
    _owner: object
  ): Option<
    ResolvedComponentDefinition<object, unknown, InternalComponentManager<unknown, object>>
  > {
    return null;
  }

  lookupPartial(_name: string, _owner: object): Option<PartialDefinition> {
    return null;
  }

  lookupBuiltInHelper(_name: string): Option<object> {
    return null;
  }

  lookupBuiltInModifier(_name: string): Option<object> {
    return null;
  }
}
