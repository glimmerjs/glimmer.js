import {
  ComponentClass,
  ComponentDefinition as GlimmerComponentDefinition
} from '@glimmer/runtime';
import ComponentManager from './component-manager';
import Component from './component';
import ComponentFactory from './component-factory';

export default class ComponentDefinition extends GlimmerComponentDefinition<Component> {
  public name: string;
  public manager: ComponentManager;
  public ComponentClass: ComponentClass;
  public componentFactory: ComponentFactory;

  constructor(name: string, manager: ComponentManager, ComponentClass: ComponentClass) {
    super(name, manager, ComponentClass);
    this.componentFactory = new ComponentFactory(ComponentClass);
  }
}
