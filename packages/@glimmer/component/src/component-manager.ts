import {
  getOwner,
  setOwner
} from '@glimmer/di';
import {
  Bounds,
  ComponentManager as GlimmerComponentManager,
  DynamicScope,
  Environment,
  PrimitiveReference,
  Simple,
  VM,
  CompiledDynamicProgram
} from '@glimmer/runtime';
import {
  UpdatableReference
} from '@glimmer/object-reference';
import {
  PathReference,
  VersionedPathReference
} from '@glimmer/reference';
import { Opaque } from '@glimmer/util';
import Component, { ComponentOptions } from './component';
import ComponentDefinition from './component-definition';

export function GlimmerID(vm: VM): PathReference<string> {
  let self = vm.getSelf().value() as { _guid: string };
  return PrimitiveReference.create(`glimmer${self._guid}`);
}

export default class ComponentManager implements GlimmerComponentManager<Component> {
  private env: Environment;

  static create(env: Environment): ComponentManager {
    return new ComponentManager(env);
  }

  constructor(env: Environment) {
    this.env = env;
  }

  prepareArgs(definition: ComponentDefinition, args: EvaluatedArgs): EvaluatedArgs {
    return null;
  }

  create(environment: Environment, definition: ComponentDefinition, args: Arguments): Component {
    let options: ComponentOptions = {
      args: args.named.capture().value()
    };
    setOwner(options, getOwner(this.env));

    let component = definition.componentFactory.create(options);

    // TODO
    // component.didInitAttrs({ attrs });
    // component.didReceiveAttrs({ oldAttrs: null, newAttrs: attrs });
    // component.willInsertElement();
    // component.willRender();

    return component;
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
