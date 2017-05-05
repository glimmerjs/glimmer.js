import {
  ComponentDefinition as GlimmerComponentDefinition,
  Template,
  CapturedArguments
} from "@glimmer/runtime";
import ComponentManager, { ComponentStateBucket } from "./component-manager";
import { ComponentFactory } from "./component";
import TemplateMeta from "./template-meta";

export default class ComponentDefinition extends GlimmerComponentDefinition<ComponentStateBucket> {
  componentFactory: ComponentFactory;
  template: Template<TemplateMeta>;
  args: CapturedArguments;

  constructor(name: string, manager: ComponentManager, template: Template<TemplateMeta>, componentFactory: ComponentFactory) {
    super(name, manager, null);

    this.template = template;
    this.componentFactory = componentFactory;
  }

  toJSON() {
    return { GlimmerDebug: "<component-definition>" };
  }
}
