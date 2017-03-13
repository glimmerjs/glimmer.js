import {
  ComponentClass,
  ComponentDefinition as GlimmerComponentDefinition,
  CompiledDynamicProgram
} from '@glimmer/runtime';
import ComponentManager from './component-manager';
import Component from './component';
import ComponentFactory from './component-factory';

export default class ComponentDefinition extends GlimmerComponentDefinition<Component> {
  public name: string;
  public manager: ComponentManager;
  public layout: CompiledDynamicProgram;
  public ComponentClass: ComponentClass;
  public componentFactory: ComponentFactory;

  constructor(name: string, manager: ComponentManager, layout: CompiledDynamicProgram, ComponentClass: ComponentClass) {
    super(name, manager, ComponentClass);
    this.layout = layout;
    this.componentFactory = new ComponentFactory(ComponentClass);
  }
}