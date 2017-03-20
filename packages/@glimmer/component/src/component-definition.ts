import {
  ComponentDefinition as GlimmerComponentDefinition,
  Template
} from '@glimmer/runtime';
import { Factory } from '@glimmer/di';
import ComponentManager from './component-manager';
import Component from './component';
import { TemplateMeta } from '@glimmer/application';

export default class ComponentDefinition extends GlimmerComponentDefinition<Component> {
  componentFactory: Factory<Component>;
  template: Template<TemplateMeta>;

  constructor(name: string, manager: ComponentManager, template: Template<TemplateMeta>, componentFactory: Factory<Component>) {
    super(name, manager, null);

    this.template = template;
    this.componentFactory = componentFactory;
  }

  toJSON() {
    return { GlimmerDebug: '<component-definition>' };
  }
}