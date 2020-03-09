import { DEBUG } from '@glimmer/env';
import { assert } from '@glimmer/util';
import {
  ComponentManager as VMComponentManager,
  ComponentCapabilities as VMComponentCapabilities,
  Dict,
  Option,
  VMArguments,
  CapturedArguments,
  JitRuntimeResolver,
  WithJitStaticLayout,
  Template,
  TemplateOk,
  Environment,
  CompilableProgram,
  DynamicScope,
} from '@glimmer/interfaces';
import { PathReference, ComponentRootReference } from '@glimmer/reference';
import { Tag, isConst, createTag, consume } from '@glimmer/validator';
import { OWNER_KEY, DEFAULT_OWNER } from '../../owner';

import { unwrapTemplate } from '@glimmer/opcode-compiler';
import { getComponentManager } from '..';
import { TemplateMeta } from '../../template';

export const VM_CAPABILITIES: VMComponentCapabilities = {
  createInstance: true,
  dynamicLayout: false,
  dynamicTag: false,
  wrapped: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  updateHook: false,
  createCaller: false,
  dynamicScope: true,
  willDestroy: false,
};

export interface Capabilities {
  asyncLifecycleCallbacks: boolean;
  destructor: boolean;
  updateHook: boolean;
}

export type OptionalCapabilities = Partial<Capabilities>;

export type ManagerAPIVersion = '3.4' | '3.13';

export function capabilities(
  managerAPI: ManagerAPIVersion,
  options: OptionalCapabilities = {}
): Capabilities {
  assert(
    managerAPI === '3.4' || managerAPI === '3.13',
    'Invalid component manager compatibility specified'
  );

  const updateHook = managerAPI !== '3.4' ? Boolean(options.updateHook) : true;

  return {
    asyncLifecycleCallbacks: Boolean(options.asyncLifecycleCallbacks),
    destructor: Boolean(options.destructor),
    updateHook,
  };
}

///////////

export interface Args {
  named: Dict<unknown>;
  positional: unknown[];
}

/**
 * This is the public facing component manager. Named `ComponentManager` so the
 * type is nice to external users, but it is different from the internal VM
 * component manager.
 */
export interface ComponentManager<ComponentInstance> {
  capabilities: Capabilities;
  createComponent(definition: unknown, args: Args): ComponentInstance;
  getContext(instance: ComponentInstance): unknown;
}

export function hasAsyncLifecycleCallbacks<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithAsyncLifecycleCallbacks<ComponentInstance> {
  return delegate.capabilities.asyncLifecycleCallbacks;
}

export interface ComponentManagerWithAsyncLifecycleCallbacks<ComponentInstance>
  extends ComponentManager<ComponentInstance> {
  didCreateComponent(instance: ComponentInstance): void;
}

export function hasUpdateHook<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithUpdateHook<ComponentInstance> {
  return delegate.capabilities.updateHook;
}

export interface ComponentManagerWithUpdateHook<ComponentInstance>
  extends ComponentManager<ComponentInstance> {
  updateComponent(instance: ComponentInstance, args: Args): void;
}

export function hasAsyncUpdateHook<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithAsyncUpdateHook<ComponentInstance> {
  return hasAsyncLifecycleCallbacks(delegate) && hasUpdateHook(delegate);
}

export interface ComponentManagerWithAsyncUpdateHook<ComponentInstance>
  extends ComponentManagerWithAsyncLifecycleCallbacks<ComponentInstance>,
    ComponentManagerWithUpdateHook<ComponentInstance> {
  didUpdateComponent(instance: ComponentInstance): void;
}

export function hasDestructors<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithDestructors<ComponentInstance> {
  return delegate.capabilities.destructor;
}

export interface ComponentManagerWithDestructors<ComponentInstance>
  extends ComponentManager<ComponentInstance> {
  destroyComponent(instance: ComponentInstance): void;
}

export interface ComponentArguments {
  positional: unknown[];
  named: Dict<unknown>;
}

export interface Destroyable {
  destroy(): void;
}

///////////

/**
  The CustomComponentManager allows addons to provide custom component
  implementations that integrate seamlessly into Ember. This is accomplished
  through a delegate, registered with the custom component manager, which
  implements a set of hooks that determine component behavior.

  To create a custom component manager, instantiate a new CustomComponentManager
  class and pass the delegate as the first argument:

  ```js
  let manager = new CustomComponentManager({
    // ...delegate implementation...
  });
  ```

  ## Delegate Hooks

  Throughout the lifecycle of a component, the component manager will invoke
  delegate hooks that are responsible for surfacing those lifecycle changes to
  the end developer.

  * `create()` - invoked when a new instance of a component should be created
  * `update()` - invoked when the arguments passed to a component change
  * `getContext()` - returns the object that should be
*/
export default class CustomComponentManager<ComponentInstance>
  implements
    VMComponentManager<
      VMCustomComponentState<ComponentInstance>,
      VMCustomComponentDefinitionState<ComponentInstance>
    >,
    WithJitStaticLayout<
      VMCustomComponentState<ComponentInstance>,
      VMCustomComponentDefinitionState<ComponentInstance>,
      JitRuntimeResolver
    > {
  create(
    env: Environment,
    definition: VMCustomComponentDefinitionState<ComponentInstance>,
    args: VMArguments,
    dynamicScope: DynamicScope
  ): VMCustomComponentState<ComponentInstance> {
    const { ComponentDefinition } = definition;
    const capturedArgs = args.capture();

    const owner = dynamicScope.get(OWNER_KEY).value() as object;
    const delegate = getComponentManager(owner, ComponentDefinition)!;

    const handler: ProxyHandler<{}> = {
      get(_target, prop) {
        if (capturedArgs.named.has(prop as string)) {
          const ref = capturedArgs.named.get(prop as string);
          consume(ref.tag);

          return ref.value();
        }
      },

      has(_target, prop) {
        return capturedArgs.named.has(prop as string);
      },

      ownKeys(_target) {
        return capturedArgs.named.names;
      },

      getOwnPropertyDescriptor(_target, prop) {
        assert(
          capturedArgs.named.has(prop as string),
          'args proxies do not have real property descriptors, so you should never need to call getOwnPropertyDescriptor yourself. This code exists for enumerability, such as in for-in loops and Object.keys()'
        );

        return {
          enumerable: true,
          configurable: true,
        };
      },
    };

    if (DEBUG) {
      handler.set = function(_target, prop): boolean {
        assert(
          false,
          `You attempted to set ${ComponentDefinition}#${String(
            prop
          )} on a components arguments. Component arguments are immutable and cannot be updated directly, they always represent the values that are passed to your component. If you want to set default values, you should use a getter instead`
        );

        return false;
      };
    }

    const namedArgsProxy = new Proxy({}, handler);

    const value = {
      named: namedArgsProxy,
      positional: capturedArgs.positional.value(),
    };

    const component = delegate.createComponent(ComponentDefinition, value);

    return new VMCustomComponentState(env, delegate, component, capturedArgs, namedArgsProxy);
  }

  update({
    delegate,
    component,
    args,
    namedArgsProxy,
  }: VMCustomComponentState<ComponentInstance>): void {
    if (hasUpdateHook(delegate)) {
      const value = {
        named: namedArgsProxy,
        positional: args.positional.value(),
      };

      delegate.updateComponent(component, value);
    }
  }

  didCreate({ delegate, component }: VMCustomComponentState<ComponentInstance>): void {
    if (hasAsyncLifecycleCallbacks(delegate)) {
      delegate.didCreateComponent(component);
    }
  }

  didUpdate({ delegate, component }: VMCustomComponentState<ComponentInstance>): void {
    if (hasAsyncUpdateHook(delegate)) {
      delegate.didUpdateComponent(component);
    }
  }

  getContext({ delegate, component }: VMCustomComponentState<ComponentInstance>): void {
    delegate.getContext(component);
  }

  getSelf({
    env,
    delegate,
    component,
  }: VMCustomComponentState<ComponentInstance>): PathReference<unknown> {
    return new ComponentRootReference(delegate.getContext(component) as object, env);
  }

  getDestructor(state: VMCustomComponentState<ComponentInstance>): Option<Destroyable> {
    if (hasDestructors(state.delegate)) {
      return state;
    }
    return null;
  }

  getCapabilities({
    capabilities,
  }: VMCustomComponentDefinitionState<ComponentInstance>): VMComponentCapabilities {
    return Object.assign({}, VM_CAPABILITIES, {
      updateHook: capabilities.updateHook,
    });
  }

  getTag({ args }: VMCustomComponentState<ComponentInstance>): Tag {
    if (isConst(args)) {
      // returning a const tag skips the update hook (VM BUG?)
      return createTag();
    }
    return args.tag;
  }

  didRenderLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didUpdateLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function

  getJitStaticLayout({
    definition,
  }: VMCustomComponentDefinitionState<ComponentInstance>): CompilableProgram {
    return definition.template.asLayout();
  }
}

///////////

/**
 * Stores internal state about a component instance after it's been created.
 */
export class VMCustomComponentState<ComponentInstance> {
  constructor(
    public env: Environment,
    public delegate: ComponentManager<ComponentInstance>,
    public component: ComponentInstance,
    public args: CapturedArguments,
    public namedArgsProxy: {}
  ) {}

  destroy(): void {
    const { delegate, component } = this;

    if (hasDestructors(delegate)) {
      delegate.destroyComponent(component);
    }
  }
}

export interface VMCustomComponentDefinitionState<ComponentInstance> {
  ComponentDefinition: ComponentDefinition<ComponentInstance>;
  capabilities: Capabilities;
  definition: VMCustomComponentDefinition<ComponentInstance>;
}

export const CUSTOM_COMPONENT_MANAGER = new CustomComponentManager();

export class VMCustomComponentDefinition<ComponentInstance> {
  public state: VMCustomComponentDefinitionState<ComponentInstance>;
  public manager = CUSTOM_COMPONENT_MANAGER as CustomComponentManager<ComponentInstance>;
  public template: TemplateOk<TemplateMeta>;
  public handle: number;

  constructor(
    handle: number,
    ComponentDefinition: ComponentDefinition<ComponentInstance>,
    template: Template<TemplateMeta>
  ) {
    this.handle = handle;
    this.template = unwrapTemplate(template);

    const capabilities = getComponentManager(DEFAULT_OWNER, ComponentDefinition)!.capabilities;

    this.state = {
      ComponentDefinition,
      capabilities,
      definition: this,
    };
  }
}

export type ComponentDefinition<_Instance = unknown> = {};
