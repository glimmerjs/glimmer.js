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
  Template,
  CapturedArguments
} from '@glimmer/runtime';
import Component from './component';
import ComponentDefinition from './component-definition';
import { RootReference } from './references';

export interface ConstructorOptions {
  env: Environment;
}

export default class ComponentManager implements GlimmerComponentManager<Component> {
  private env: Environment;
  private args = new WeakMap<Component, CapturedArguments>();

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

    let capturedArgs = args.capture();

    let injections = {
      debugName: definition.name,
      args: Object.freeze(capturedArgs.named.value())
    };

    setOwner(injections, getOwner(this.env));

    let component = definition.componentFactory.create(injections);
    this.args.set(component, capturedArgs);

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
    // TODO: This should be moved to `didUpdate`, but there's currently a
    // Glimmer bug that causes it not to be called if the layout doesn't update.
    let args = this.args.get(component);
    component.args = Object.freeze(args.named.value());
    component.didUpdate();
  }

  didUpdateLayout() {}

  didUpdate(component: Component) {
  }

  getDestructor(): null {
    return null;
  }
}
