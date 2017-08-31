import ComponentManager from "./component-manager";
import { ComponentCapabilities } from '@glimmer/opcode-compiler';
import { Option, Opaque } from '@glimmer/interfaces';

export interface Definition {
  capabilities: ComponentCapabilities;
}

export default class ComponentDefinition implements Definition {
  public capabilities: ComponentCapabilities = {
    staticDefinitions: false,
    dynamicLayout: false,
    dynamicTag: true,
    prepareArgs: false,
    createArgs: true,
    attributeHook: true,
    elementHook: false
  };

  constructor(public name: string, public manager: ComponentManager, public ComponentClass: Opaque, public layout: Option<number>) {
  }

  toJSON() {
    return { GlimmerDebug: `<component-definition name="${this.name}">` };
  }
}
