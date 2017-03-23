import {
  getOwner,
  setOwner,
  Factory
} from '@glimmer/di';
import {
  Bounds,
  ComponentManager as GlimmerComponentManager,
  DynamicScope,
  Environment,
  Simple,
  CompiledDynamicProgram,
  Arguments,
  Template
} from '@glimmer/runtime';
import Component from './component';
import ComponentDefinition from './component-definition';
import { RootReference } from './references';

export interface ConstructorOptions {
  env: Environment;
}

export default class ComponentManager implements GlimmerComponentManager<Component> {
  private env: Environment;

  static create(options: ConstructorOptions): ComponentManager {
    return new ComponentManager(options);
  }

  constructor(options: ConstructorOptions) {
    this.env = options.env;
  }

  prepareArgs(definition: ComponentDefinition, args: Arguments): null {
    return null;
  }

  create(environment: Environment, definition: ComponentDefinition, args: Arguments): Component {
    let componentFactory = definition.componentFactory;
    if (!componentFactory) { return null; }

    let injections = {
      debugName: definition.name
    };

    setOwner(injections, getOwner(this.env));

    return definition.componentFactory.create(injections);
  }

  createComponentDefinition(name: string, template: Template<any>, componentFactory?: Factory<Component>): ComponentDefinition {
    return new ComponentDefinition(name, this, template, componentFactory);
  }

  layoutFor(definition: ComponentDefinition, component: Component, env: Environment): CompiledDynamicProgram {
    let template = definition.template;
    let compiledLayout = template.asLayout().compileDynamic(this.env);

    return compiledLayout;
  }

  getSelf(component: Component) {
    return new RootReference(component);
  }

  didCreateElement(component: Component, element: Simple.Element) {
    if (!component) { return; }
    component.element = element;
  }

  didRenderLayout(component: Component, bounds: Bounds) {
    // component.bounds = bounds;
  }

  didCreate(component: Component) {
    component && component.didInsertElement();
  }

  getTag(component: Component): null {
    return null;
  }

  update(component: Component, scope: DynamicScope) {
  }

  didUpdateLayout() {}

  didUpdate(component: Component) {
    component.didUpdate();
  }

  getDestructor(): null {
    return null;
  }
}