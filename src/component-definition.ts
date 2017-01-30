import {
  ComponentDefinition as GlimmerComponentDefinition,
  Template
} from '@glimmer/runtime';
import { Dict } from '@glimmer/util';
import ComponentManager from './component-manager';
import { ComponentFactory } from './component-factory';
import Component from './component';

export default class ComponentDefinition extends GlimmerComponentDefinition<Component> {
  public manager: ComponentManager;
  public name: string;
  public args: Dict<any>;
  public ComponentClass: any;

  constructor(name: string, manager: ComponentManager, ComponentClass: Component, args?: Dict<any>) {
    super(name, manager, ComponentClass);
    this.name = name;
    this.args = args;
  }
}
