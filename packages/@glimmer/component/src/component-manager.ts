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
import { DefinitionState } from "./component-definition";
import { RootReference } from "./references";
import { Dict, Destroyable, Opaque, Option } from "@glimmer/util";
import { Tag } from "@glimmer/reference";
import { RuntimeResolver, Simple, ComponentCapabilities } from "@glimmer/interfaces";
import { VersionedPathReference } from '@glimmer/reference';

export interface ConstructorOptions {
  env: Environment;
}

export class ComponentStateBucket {
  public name: string;
  public component: Component;
  private args: CapturedArguments;

  constructor(definition: DefinitionState, args: CapturedArguments, owner: Owner) {
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

export interface CompilableRuntimeResolver extends RuntimeResolver<Opaque> {
  compileTemplate(name: string, layout: Option<number>): Invocation;
}

export default class ComponentManager implements IComponentManager<ComponentStateBucket, DefinitionState>, WithStaticLayout<ComponentStateBucket, DefinitionState, Opaque, CompilableRuntimeResolver> {
  private env: Environment;

  static create(options: ConstructorOptions): ComponentManager {
    return new ComponentManager(options);
  }

  constructor(options: ConstructorOptions) {
    this.env = options.env;
  }

  prepareArgs(state: DefinitionState, args: Arguments): null {
    return null;
  }

  getCapabilities(state: DefinitionState): ComponentCapabilities {
    return state.capabilities;
  }

  getLayout({ name, layout }: DefinitionState, resolver: CompilableRuntimeResolver): Invocation {
    return resolver.compileTemplate(name, layout);
  }

  create(_env: Environment, definition: DefinitionState, args: Arguments, _dynamicScope: DynamicScope, _caller: VersionedPathReference<Opaque>, _hasDefaultBlock: boolean): ComponentStateBucket {
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
