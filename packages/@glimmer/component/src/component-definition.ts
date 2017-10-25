import ComponentManager from "./component-manager";
import { Option, ComponentCapabilities, SymbolTable } from '@glimmer/interfaces';
import { ComponentFactory } from './component';
import { ComponentDefinition as IComponentDefinition } from '@glimmer/runtime';

export const capabilities: ComponentCapabilities = {
  dynamicLayout: false,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: true,
  attributeHook: true,
  elementHook: true
};

export interface DefinitionState {
  /* Manager-related */
  capabilities: ComponentCapabilities;

  /* Component-related */
  name: string;
  ComponentClass: any;
  handle?: number;
  symbolTable?: SymbolTable;
}

export default class ComponentDefinition implements IComponentDefinition {
  state: DefinitionState;
  constructor(public name: string, public manager: ComponentManager, public ComponentClass: ComponentFactory, public handle: Option<number>) {
    this.state = {
      name,
      capabilities,
      ComponentClass,
      handle
    };
  }

  toJSON() {
    return { GlimmerDebug: `<component-definition name="${this.name}">` };
  }
}
