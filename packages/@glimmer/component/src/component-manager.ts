import { Owner } from '@glimmer/di';
import { Tag } from '@glimmer/reference';
import {
  ComponentManager as VMComponentManager,
  RuntimeResolver,
  ComponentCapabilities,
  CapturedArguments,
  Dict,
  Option,
  Invocation,
  Environment,
  VMArguments,
  WithAotStaticLayout,
  DynamicScope,
  Destroyable,
  JitRuntimeResolver,
  AotRuntimeResolver,
  CompilableProgram,
  Bounds as VMBounds,
} from '@glimmer/interfaces';
import { VersionedPathReference, PathReference, CONSTANT_TAG } from '@glimmer/reference';
import { DEBUG } from '@glimmer/env';

import Component from './component';
import { DefinitionState } from './component-definition';
import Bounds from './bounds';
import { RootReference, TemplateOnlyComponentDebugReference } from './references';
import ExtendedTemplateMeta from './template-meta';
import { SerializedTemplateWithLazyBlock } from '@glimmer/application/src/loaders/runtime-compiler/resolver';
import { Specifier } from '@glimmer/application/src/loaders/runtime-compiler/loader';

import { MAGIC_PROP, DESTROYING, DESTROYED } from '../addon/-private/component';

export interface ConstructorOptions {
  env: EnvironmentWithOwner;
}

export class ComponentStateBucket {
  public name: string;
  public component: Component;
  private args: CapturedArguments;

  constructor(
    definition: DefinitionState,
    args: CapturedArguments,
    owner: Owner,
    env: EnvironmentWithOwner
  ) {
    let { ComponentClass, name } = definition;
    this.args = args;

    if (ComponentClass) {
      if (ComponentClass.class !== undefined) {
        ComponentClass = ComponentClass.class;
      }

      this.component = new ComponentClass(owner, this.namedArgsSnapshot());
      this.component.debugName = name;
    }
  }

  get tag(): Tag {
    return this.args.tag;
  }

  namedArgsSnapshot(): Readonly<Dict<unknown>> {
    let snapshot = this.args.named.value();

    if (DEBUG) {
      Object.defineProperty(snapshot, MAGIC_PROP, {
        enumerable: false,
        value: true,
      });
    }

    return Object.freeze(snapshot);
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
  constructor(public definition: DefinitionState) {}
}

export interface CompilableRuntimeResolver extends RuntimeResolver<ExtendedTemplateMeta> {
  compileTemplate(name: string, layout: Option<number>): Invocation;
}

export interface EnvironmentWithOwner extends Environment {
  getOwner(): Owner;
  setOwner(obj: Object, owner: Owner): void;
}

export default class ComponentManager
  implements
    VMComponentManager<
      ComponentStateBucket | TemplateOnlyComponentDebugBucket | void,
      DefinitionState
    >,
    WithAotStaticLayout<
      ComponentStateBucket | TemplateOnlyComponentDebugBucket | void,
      DefinitionState,
      AotRuntimeResolver
    > {
  private env: EnvironmentWithOwner;

  static create(options: ConstructorOptions): ComponentManager {
    return new ComponentManager(options);
  }

  constructor(options: ConstructorOptions) {
    this.env = options.env;
  }

  prepareArgs(state: DefinitionState, args: VMArguments): null {
    return null;
  }

  getCapabilities(state: DefinitionState): ComponentCapabilities {
    return state.capabilities;
  }

  getJitStaticLayout(state: DefinitionState, resolver: JitRuntimeResolver): CompilableProgram {
    let template = (resolver.resolve(state.handle) as unknown) as SerializedTemplateWithLazyBlock<
      Specifier
    >;
    let locator = template.meta;
    return resolver.compilable(locator).asLayout();
  }

  getAotStaticLayout(
    { name, handle, symbolTable }: DefinitionState,
    resolver: AotRuntimeResolver
  ): Invocation {
    if (handle && symbolTable) {
      return {
        handle,
        symbolTable,
      };
    }

    throw new Error('unimplemented getAotStaticLayout');
  }

  create(
    _env: Environment,
    definition: DefinitionState,
    args: VMArguments,
    _dynamicScope: DynamicScope,
    _caller: VersionedPathReference<unknown>,
    _hasDefaultBlock: boolean
  ): TemplateOnlyComponentDebugBucket | ComponentStateBucket | void {
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

  didCreateElement(bucket: ComponentStateBucket, element: HTMLElement) {}

  didRenderLayout(bucket: ComponentStateBucket, bounds: VMBounds) {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) {
      return;
    }
    if (!bucket) {
      return;
    }
    bucket.component.bounds = new Bounds(bounds);
  }

  didCreate(bucket: ComponentStateBucket) {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) {
      return;
    }
    if (!bucket) {
      return;
    }
    bucket.component.didInsertElement();
  }

  getTag(bucket: ComponentStateBucket): Tag {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) {
      return CONSTANT_TAG;
    }
    if (!bucket) {
      return CONSTANT_TAG;
    }
    return bucket.tag;
  }

  update(bucket: ComponentStateBucket, scope: DynamicScope) {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) {
      return;
    }
    if (!bucket) {
      return;
    }

    bucket.component.args = bucket.namedArgsSnapshot();
  }

  didUpdateLayout() {}

  didUpdate() {}

  getDestructor(bucket: ComponentStateBucket): Destroyable {
    if (DEBUG && bucket instanceof TemplateOnlyComponentDebugBucket) {
      return NOOP_DESTROYABLE;
    }
    if (!bucket) {
      return NOOP_DESTROYABLE;
    }

    return {
      destroy() {
        bucket.component[DESTROYING] = true;
        bucket.component.willDestroy();
        bucket.component[DESTROYED] = true;
      },
    };
  }
}

const NOOP_DESTROYABLE = { destroy() {} };
