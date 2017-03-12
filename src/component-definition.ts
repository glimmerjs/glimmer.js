import {
  ComponentDefinition as GlimmerComponentDefinition
} from '@glimmer/runtime';
import {
  Factory
} from '@glimmer/di';
import ComponentManager from './component-manager';
import Component from './component';

export default class ComponentDefinition extends GlimmerComponentDefinition<Component> {
  public name: string;
  public manager: ComponentManager;
  public ComponentClass: Factory<Component>;
}
