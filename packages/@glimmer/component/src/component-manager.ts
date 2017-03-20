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
import {
  UpdatableReference
} from '@glimmer/object-reference';
import {
  VersionedPathReference
} from '@glimmer/reference';
import { Opaque } from '@glimmer/util';
import Component from './component';
import ComponentDefinition from './component-definition';

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

    let injections = {};
    setOwner(injections, getOwner(this.env));

    let component = componentFactory.create(injections);

    return component;
  }

  createComponentDefinition(name: string, template: Template<any>, componentFactory?: Factory<Component>): ComponentDefinition {
    return new ComponentDefinition(name, this, template, componentFactory);
  }

  layoutFor(definition: ComponentDefinition, component: Component, env: Environment): CompiledDynamicProgram {
    let template = definition.template;
    let compiledLayout = template.asLayout().compileDynamic(this.env);

    return compiledLayout;
  }

  getSelf(component: Component): VersionedPathReference<Opaque> {
    return new UpdatableReference(component);
  }

  didCreateElement(component: Component, element: Simple.Element) {
    if (!component) { return; }
    component.element = element;
  }

  didRenderLayout(component: Component, bounds: Bounds) {
    // component.bounds = bounds;
  }

  didCreate(component: Component) {
    // TODO
    // component.didInsertElement();
    // component.didRender();
  }

  getTag() {
    return null;
  }

  update(component: Component, scope: DynamicScope) {
  }

  didUpdateLayout() {}

  didUpdate() {}

  getDestructor() {
    return null;
  }
}
