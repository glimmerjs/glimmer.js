import {
  ComponentDefinition as GlimmerComponentDefinition,
  Template,
  CapturedArguments
} from '@glimmer/runtime';
import ComponentManager from './component-manager';
import Component, { ComponentFactory } from './component';
import { TemplateMeta } from '@glimmer/application';

export default class ComponentDefinition extends GlimmerComponentDefinition<Component> {
  componentFactory: ComponentFactory;
  template: Template<TemplateMeta>;
  args: CapturedArguments;

  constructor(name: string, manager: ComponentManager, template: Template<TemplateMeta>, componentFactory: ComponentFactory) {
    super(name, manager, null);

    this.template = template;
    this.componentFactory = componentFactory;
  }

  toJSON() {
    return { GlimmerDebug: '<component-definition>' };
  }
}
