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
import { PathReference } from '@glimmer/reference';
import { Tag, isConst, createTag, consume } from '@glimmer/validator';
import { setScope, PUBLIC_DYNAMIC_SCOPE_KEY } from '../../scope';

import { RootReference } from '../../references';
import { unwrapTemplate } from '@glimmer/opcode-compiler';
import { Capabilities } from './capabilities';

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
};

///////////

export const SHOULD_SET_SCOPE = Symbol('SHOULD_SET_SCOPE');

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
  createComponent(factory: unknown, args: Args): ComponentInstance;
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

export interface TemplateMeta {
  scope: () => Dict<unknown>;
}

export interface Destroyable {
  destroy(): void;
}

export interface Factory<T, C extends object = object> {
  class?: C;
  fullName?: string;
  normalizedName?: string;
  create(props?: { [prop: string]: any }): T;
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
    CustomComponentState<ComponentInstance>,
    CustomComponentDefinitionState<ComponentInstance>
    >,
    WithJitStaticLayout<
      CustomComponentState<ComponentInstance>,
      CustomComponentDefinitionState<ComponentInstance>,
      JitRuntimeResolver
    > {
  create(
    _env: Environment,
    definition: CustomComponentDefinitionState<ComponentInstance>,
    args: VMArguments,
    dynamicScope: DynamicScope,
  ): CustomComponentState<ComponentInstance> {
    const { delegate } = definition;
    const capturedArgs = args.capture();

    let value;

    let handler: ProxyHandler<{}> = {
      get(_target, prop) {
        if (capturedArgs.named.has(prop as string)) {
          let ref = capturedArgs.named.get(prop as string);
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
          'args proxies do not have real property descriptors, so you should never need to call getOwnPropertyDescriptor yourself. This code exists for enumerability, such as in for-in loops and Object.keys()',
        );

        return {
          enumerable: true,
          configurable: true,
        };
      },
    };

    if (DEBUG) {
      handler.set = function(_target, prop) {
        assert(
          false,
          `You attempted to set ${definition.ComponentClass}#${String(
            prop
          )} on a components arguments. Component arguments are immutable and cannot be updated directly, they always represent the values that are passed to your component. If you want to set default values, you should use a getter instead`
        );

        return false;
      };
    }

    let namedArgsProxy = new Proxy({}, handler);

    value = {
      named: namedArgsProxy,
      positional: capturedArgs.positional.value(),
    };

    const component = delegate.createComponent(definition.ComponentClass, value);

    const publicScope = dynamicScope.get(PUBLIC_DYNAMIC_SCOPE_KEY);

    // Currently, we only want to allow access to scope on our own components,
    // not via custom component managers
    if ((delegate as any)[SHOULD_SET_SCOPE] === true && publicScope !== undefined) {
      setScope(component as any, publicScope.value() as Dict<unknown>);
    }

    return new CustomComponentState(delegate, component, capturedArgs, namedArgsProxy);
  }

  update({ delegate, component, args, namedArgsProxy }: CustomComponentState<ComponentInstance>) {
    if (hasUpdateHook(delegate)) {
      const value = {
        named: namedArgsProxy,
        positional: args.positional.value(),
      };

      delegate.updateComponent(component, value);
    }
  }

  didCreate({ delegate, component }: CustomComponentState<ComponentInstance>) {
    if (hasAsyncLifecycleCallbacks(delegate)) {
      delegate.didCreateComponent(component);
    }
  }

  didUpdate({ delegate, component }: CustomComponentState<ComponentInstance>) {
    if (hasAsyncUpdateHook(delegate)) {
      delegate.didUpdateComponent(component);
    }
  }

  getContext({ delegate, component }: CustomComponentState<ComponentInstance>) {
    delegate.getContext(component);
  }

  getSelf({ delegate, component }: CustomComponentState<ComponentInstance>): PathReference<unknown> {
    return new RootReference(delegate.getContext(component) as object);
  }

  getDestructor(state: CustomComponentState<ComponentInstance>): Option<Destroyable> {
    if (hasDestructors(state.delegate)) {
      return state;
    } else {
      return null;
    }
  }

  getCapabilities({
    delegate,
  }: CustomComponentDefinitionState<ComponentInstance>): VMComponentCapabilities {
    return Object.assign({}, VM_CAPABILITIES, {
      updateHook: delegate.capabilities.updateHook,
    });
  }

  getTag({ args }: CustomComponentState<ComponentInstance>): Tag {
    if (isConst(args)) {
      // returning a const tag skips the update hook (VM BUG?)
      return createTag();
    } else {
      return args.tag;
    }
  }

  didRenderLayout() {}
  didUpdateLayout() {}

  getJitStaticLayout({ definition }: CustomComponentDefinitionState<ComponentInstance>): CompilableProgram {
    return definition.template.asLayout();
  }
}

///////////

/**
 * Stores internal state about a component instance after it's been created.
 */
export class CustomComponentState<ComponentInstance> {
  constructor(
    public delegate: ComponentManager<ComponentInstance>,
    public component: ComponentInstance,
    public args: CapturedArguments,
    public namedArgsProxy: {}
  ) {}

  destroy() {
    const { delegate, component } = this;

    if (hasDestructors(delegate)) {
      delegate.destroyComponent(component);
    }
  }
}

export interface CustomComponentDefinitionState<ComponentInstance> {
  delegate: ComponentManager<ComponentInstance>;
  ComponentClass: ComponentFactory;
  definition: CustomComponentDefinition<ComponentInstance>;
}

export const CUSTOM_COMPONENT_MANAGER = new CustomComponentManager();

export class CustomComponentDefinition<ComponentInstance> {
  public state: CustomComponentDefinitionState<ComponentInstance>;
  public manager = CUSTOM_COMPONENT_MANAGER as CustomComponentManager<ComponentInstance>;
  public template: TemplateOk<TemplateMeta>;
  public handle: number;

  constructor(
    handle: number,
    ComponentClass: ComponentFactory,
    delegate: ComponentManager<ComponentInstance>,
    template: Template<TemplateMeta>
  ) {
    this.handle = handle;
    this.template = unwrapTemplate(template);

    this.state = {
      ComponentClass,
      delegate,
      definition: this
    };
  }
}

export interface ComponentFactory {}