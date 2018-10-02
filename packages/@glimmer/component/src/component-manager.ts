import { Owner } from "@glimmer/di";
import {
  Bounds as VMBounds,
  ComponentManager as IComponentManager,
  DynamicScope,
  Environment,
  Arguments,
  CapturedArguments,
  WithStaticLayout,
  Invocation,
} from "@glimmer/runtime";
import { Dict, Destroyable, Opaque, Option } from "@glimmer/util";
import { Tag } from "@glimmer/reference";
import { RuntimeResolver, ComponentCapabilities, Recast, VMHandle } from "@glimmer/interfaces";
import { VersionedPathReference, PathReference, CONSTANT_TAG } from '@glimmer/reference';
import { DEBUG } from '@glimmer/env';

import Component from "./component";
import Bounds from './bounds';
import { DefinitionState } from "./component-definition";
import { RootReference, TemplateOnlyComponentDebugReference } from "./references";

export interface ConstructorOptions {
  env: Environment;
}

export class ComponentStateBucket {
  public name: string;
  public component: Component;
  private args: CapturedArguments;

  constructor(definition: DefinitionState, args: CapturedArguments, owner: Owner, env: Environment) {
    let componentFactory = definition.ComponentClass;
    let name = definition.name;

    this.args = args;

    let injections = {
      debugName: name,
      args: this.namedArgsSnapshot()
    };

    env.setOwner(injections, owner);
    if (componentFactory) {
      this.component = componentFactory.create(injections);
    }
  }

  get tag(): Tag {
    return this.args.tag;
  }

  namedArgsSnapshot(): Readonly<Dict<Opaque>> {
    return Object.freeze(this.args.named.value());
  }
}

const EMPTY_SELF = new RootReference(null);

/**
 * For performance reasons, we want to avoid instantiating component buckets for
 * components that don't have an associated component class that we would need
 * instantiate and invoke lifecycle hooks on.
 *
 * In development mode, however, we need to track some state about the component
 * in order to produce more useful error messages. This
 * TemplateOnlyComponentDebugBucket is only created in development mode to hold
 * that state.
 */
export class TemplateOnlyComponentDebugBucket {
  constructor(public definition: DefinitionState) {
  }
}

export interface CompilableRuntimeResolver extends RuntimeResolver<Opaque> {
  compileTemplate(name: string, layout: Option<number>): Invocation;
}

export default class ComponentManager implements IComponentManager<ComponentStateBucket | TemplateOnlyComponentDebugBucket | void, DefinitionState>, WithStaticLayout<ComponentStateBucket | TemplateOnlyComponentDebugBucket | void, DefinitionState, Opaque, CompilableRuntimeResolver> {
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

  getLayout({ name, handle, symbolTable }: DefinitionState, resolver: CompilableRuntimeResolver): Invocation {
    if (handle && symbolTable) {
      return {
        handle,
        symbolTable
      };
    }

    return resolver.compileTemplate(name, handle as Recast<VMHandle, number>);
  }

  create(_env: Environment, definition: DefinitionState, args: Arguments, _dynamicScope: DynamicScope, _caller: VersionedPathReference<Opaque>, _hasDefaultBlock: boolean): TemplateOnlyComponentDebugBucket | ComponentStateBucket | void {
    // In development mode, if a component is template-only, save off state
    // needed for error messages. This will get stripped in production mode and
    // no bucket will be instantiated.
    if (DEBUG && !definition.ComponentClass) {
      return new TemplateOnlyComponentDebugBucket(definition);
    }

    // Only create a state bucket if the component is actually stateful. We can
    // skip this for template-only components, which are pure functions.
    if (definition.ComponentClass) {
      let owner = this.env.getOwner();
      return new ComponentStateBucket(definition, args.capture(), owner, this.env);
    }
  }

  getSelf(bucket: ComponentStateBucket): PathReference {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) {
      return new TemplateOnlyComponentDebugReference(bucket.definition.name);
    }
    if (bucket) {
      return new RootReference(bucket.component);
    }
    return EMPTY_SELF;
  }

  didCreateElement(bucket: ComponentStateBucket, element: HTMLElement) { }

  didRenderLayout(bucket: ComponentStateBucket, bounds: VMBounds) {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) { return; }
    if (!bucket) { return; }
    bucket.component.bounds = new Bounds(bounds);
  }

  didCreate(bucket: ComponentStateBucket) {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) { return; }
    if (!bucket) { return; }
    bucket.component.didInsertElement();
  }

  getTag(bucket: ComponentStateBucket): Tag {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) { return CONSTANT_TAG; }
    if (!bucket) { return CONSTANT_TAG; }
    return bucket.tag;
  }

  update(bucket: ComponentStateBucket, scope: DynamicScope) {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) { return; }
    if (!bucket) { return; }

    bucket.component.args = bucket.namedArgsSnapshot();
  }

  didUpdateLayout() {}

  didUpdate(bucket: ComponentStateBucket) {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) { return; }
    if (!bucket) { return; }

    bucket.component.didUpdate();
  }

  getDestructor(bucket: ComponentStateBucket): Destroyable {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) { return NOOP_DESTROYABLE; }
    if (!bucket) { return NOOP_DESTROYABLE; }

    return bucket.component;
  }
}

const NOOP_DESTROYABLE = { destroy() {} };
