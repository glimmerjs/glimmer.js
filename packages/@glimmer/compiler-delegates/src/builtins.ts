import { ModuleLocator, TemplateLocator, AnnotatedModuleLocator } from '@glimmer/interfaces';

/*
 * "Builtins" describe helpers, components and templates that originate from
 * libraries or other ambient dependencies, not the application itself. These
 * objects are implicitly available in the global scope, and need to be included
 * in the final build output from underlying libraries.
 *
 * Host environments are responsible for registering all available builtins before
 * compilation to ensure they are included in the bundle and do not cause errors during
 * resolution.
 */
export interface Builtins<TemplateMeta = {}> {
  [key: string]: BuiltinLocator<TemplateMeta>;
}

export type BuiltinLocator<TemplateMeta> = TemplateLocator<TemplateMeta> | HelperLocator | ModuleLocator;

/**
 * There are two ways helpers may be implemented in libraries:
 *
 * 1. A "user helper" that is a pure JavaScript function that takes one or more
 *    parameters and named arguments and returns a value.
 * 2. A "low-level helper", a factory function that takes the VM instance and a
 *    stable Arguments object and returns a Reference.
 *
 * Encoding which type a helper is is important, because user helpers must be
 * wrapped in the appropriate Reference in order to function. Thus, locators for
 * a helper must notate whether the helper is low-level or not.
 */
export interface HelperLocator extends AnnotatedModuleLocator {
  kind: 'helper';
  meta: {
    factory?: boolean;
  };
}

export type ModulePath = string;
export type Name = string;
export type Identifier = string;

export interface BuiltinsMap<TemplateMeta = {}> {
  byName: Map<Name, ModulePath>;
  byIdentifier: Map<Identifier, BuiltinLocator<TemplateMeta>>;
  byModulePath: Map<ModulePath, Name>;
}
