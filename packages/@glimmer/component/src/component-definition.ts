import ComponentManager from "./component-manager";
import { Option, ComponentCapabilities } from '@glimmer/interfaces';
import { ComponentFactory } from './component';
import { ComponentDefinition as IComponentDefinition } from '@glimmer/runtime';

const capabilities: ComponentCapabilities = {
  staticDefinitions: false,
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
  layout: Option<number>;
}

export default class ComponentDefinition implements IComponentDefinition {
  state: DefinitionState;
  constructor(public name: string, public manager: ComponentManager, public ComponentClass: ComponentFactory, public layout: Option<number>) {
    this.state = {
      name,
      capabilities,
      ComponentClass,
      layout
    };
  }

  toJSON() {
    return { GlimmerDebug: `<component-definition name="${this.name}">` };
  }
}
