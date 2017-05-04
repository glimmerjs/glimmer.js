import {
  getOwner,
  setOwner,
  Factory,
  Owner
} from "@glimmer/di";
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
} from "@glimmer/runtime";
import Component from "./component";
import ComponentDefinition from "./component-definition";
import { RootReference } from "./references";
import { Dict, Destroyable } from "@glimmer/util";

export interface ConstructorOptions {
  env: Environment;
}

export class ComponentStateBucket {
  public name: string;
  public component: Component;
  private args: CapturedArguments;

  constructor(definition: ComponentDefinition, args: CapturedArguments, owner: Owner) {
    let componentFactory = definition.componentFactory;
    let name = definition.name;

    this.args = args;

    let injections = {
      debugName: name,
      args: this.namedArgsSnapshot()
    };

    setOwner(injections, owner);
    this.component = componentFactory.create(injections);
  }

  namedArgsSnapshot(): Readonly<Dict<object | void>> {
    return Object.freeze(this.args.named.value());
  }
}

export default class ComponentManager implements GlimmerComponentManager<ComponentStateBucket> {
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

  create(environment: Environment, definition: ComponentDefinition, volatileArgs: Arguments): ComponentStateBucket | null {
    let componentFactory = definition.componentFactory;
    if (!componentFactory) { return null; }

    let owner = getOwner(this.env);
    return new ComponentStateBucket(definition, volatileArgs.capture(), owner);
  }

  createComponentDefinition(name: string, template: Template<any>, componentFactory?: Factory<Component>): ComponentDefinition {
    return new ComponentDefinition(name, this, template, componentFactory);
  }

  layoutFor(definition: ComponentDefinition, bucket: ComponentStateBucket, env: Environment): CompiledDynamicProgram {
    let template = definition.template;
    let compiledLayout = template.asLayout().compileDynamic(this.env);

    return compiledLayout;
  }

  getSelf(bucket: ComponentStateBucket) {
    if (!bucket) { return null; }
    return new RootReference(bucket.component);
  }

  didCreateElement(bucket: ComponentStateBucket, element: Simple.Element) {
    if (!bucket) { return; }
    bucket.component.element = element;
  }

  didRenderLayout(bucket: ComponentStateBucket, bounds: Bounds) {
  }

  didCreate(bucket: ComponentStateBucket) {
    bucket && bucket.component.didInsertElement();
  }

  getTag(): null {
    return null;
  }

  update(bucket: ComponentStateBucket, scope: DynamicScope) {
    if (!bucket) { return; }

    // TODO: This should be moved to `didUpdate`, but there's currently a
    // Glimmer bug that causes it not to be called if the layout doesn't update.
    let { component } = bucket;

    component.args = bucket.namedArgsSnapshot();
    component.didUpdate();
  }

  didUpdateLayout() {}

  didUpdate(bucket: ComponentStateBucket) { }

  getDestructor(bucket: ComponentStateBucket): Destroyable {
    if (!bucket) { return; }

    return bucket.component;
  }
}
