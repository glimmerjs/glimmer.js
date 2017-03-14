import {
  ComponentClass,
  ComponentDefinition as GlimmerComponentDefinition,
  CompiledDynamicProgram,
  Template
} from '@glimmer/runtime';
import { Factory } from '@glimmer/di';
import ComponentManager from './component-manager';
import Component from './component';

export default class ComponentDefinition extends GlimmerComponentDefinition<Component> {
  public name: string;
  public manager: ComponentManager;
  public template: Template<any>;
  public componentFactory: Factory<Component>;

  constructor(name: string, manager: ComponentManager, componentFactory: Factory<Component>, template: Template<any>) {
    super(name, manager, null);

    this.template = template;
    this.componentFactory = componentFactory;
  }

  toJSON() {
    return { GlimmerDebug: '<component-definition>' };
  }
}