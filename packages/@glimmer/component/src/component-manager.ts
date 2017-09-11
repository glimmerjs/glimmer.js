import {
  getOwner,
  setOwner,
  Owner
} from "@glimmer/di";
import {
  Bounds,
  ComponentManager as IComponentManager,
  DynamicScope,
  Environment,
  Arguments,
  CapturedArguments,
  WithStaticLayout,
  Invocation,
} from "@glimmer/runtime";
import Component from "./component";
import ComponentDefinition from "./component-definition";
import { RootReference } from "./references";
import { Dict, Destroyable, Opaque } from "@glimmer/util";
import { Tag } from "@glimmer/reference";
import { Simple } from "@glimmer/interfaces";
import { ComponentCapabilities } from '@glimmer/opcode-compiler';
import { VersionedPathReference } from '@glimmer/reference';
import { RuntimeResolver } from '@glimmer/application';

export interface ConstructorOptions {
  env: Environment;
}

export class ComponentStateBucket {
  public name: string;
  public component: Component;
  private args: CapturedArguments;

  constructor(definition: ComponentDefinition, args: CapturedArguments, owner: Owner) {
    let componentFactory = definition.ComponentClass;
    let name = definition.name;

    this.args = args;

    let injections = {
      debugName: name,
      args: this.namedArgsSnapshot()
    };

    setOwner(injections, owner);
    this.component = componentFactory.create(injections);
  }

  get tag(): Tag {
    return this.args.tag;
  }

  namedArgsSnapshot(): Readonly<Dict<Opaque>> {
    return Object.freeze(this.args.named.value());
  }
}

export default class ComponentManager implements IComponentManager<ComponentStateBucket, ComponentDefinition>, WithStaticLayout<ComponentStateBucket, ComponentDefinition, Opaque, RuntimeResolver> {
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

  getCapabilities(definition: ComponentDefinition): ComponentCapabilities {
    return definition.capabilities;
  }

  getLayout(definition: ComponentDefinition, resolver: RuntimeResolver): Invocation {
    return resolver.compileTemplate(definition);
  }

  create(_env: Environment, definition: ComponentDefinition, args: Arguments, _dynamicScope: DynamicScope, _caller: VersionedPathReference<Opaque>, _hasDefaultBlock: boolean): ComponentStateBucket {
    let owner = getOwner(this.env);
    return new ComponentStateBucket(definition, args.capture(), owner);
  }

  getSelf(bucket: ComponentStateBucket): RootReference {
    return new RootReference(bucket.component);
  }

  didCreateElement(bucket: ComponentStateBucket, element: Simple.Element) {
    if (!bucket) { return; }
    bucket.component.element = element;
  }

  didRenderLayout(bucket: ComponentStateBucket, bounds: Bounds) {
  }

  didCreate(bucket: ComponentStateBucket) {
    if (bucket) { bucket.component.didInsertElement(); }
  }

  getTag({ tag }: ComponentStateBucket): Tag {
    return tag;
  }

  update(bucket: ComponentStateBucket, scope: DynamicScope) {
    bucket.component.args = bucket.namedArgsSnapshot();
  }

  didUpdateLayout() {}

  didUpdate({ component }: ComponentStateBucket) {
    component.didUpdate();
  }

  getDestructor(bucket: ComponentStateBucket): Destroyable {
    return bucket.component;
  }
}
