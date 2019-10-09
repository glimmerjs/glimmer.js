import {
  ComponentDefinition as VMComponentDefinition,
  Template,
  ProgramSymbolTable,
  ComponentManager,
} from '@glimmer/interfaces';

export type ComponentDefinitionState = unknown;
export type ComponentInstanceState = unknown;

export interface AotComponentDefinition<
  D = ComponentDefinitionState,
  I = ComponentInstanceState,
  M extends ComponentManager<I, D> = ComponentManager<I, D>
> extends VMComponentDefinition<D, I, M> {
  handle: number;
  symbolTable?: ProgramSymbolTable;
}

export interface JitComponentDefinition<
  D = ComponentDefinitionState,
  I = ComponentInstanceState,
  M extends ComponentManager<I, D> = ComponentManager<I, D>
> extends VMComponentDefinition<D, I, M> {
  template: Template;
}

export type ComponentDefinition = JitComponentDefinition | AotComponentDefinition;

export function isAotComponentDefinition(
  definition: ComponentDefinition
): definition is AotComponentDefinition {
  return typeof (definition as AotComponentDefinition).handle === 'number';
}
