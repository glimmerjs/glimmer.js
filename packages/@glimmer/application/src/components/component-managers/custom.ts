import { DEBUG } from '@glimmer/env';
import { consume } from '@glimmer/tracking';
import { Owner } from '@glimmer/di';
import { assert } from '@glimmer/util';
import {
  ComponentManager as VMComponentManager,
  ComponentCapabilities,
  Dict,
  Option,
  ProgramSymbolTable,
  VMArguments,
  CapturedArguments,
  JitRuntimeResolver,
  WithJitStaticLayout,
  Template,
  Environment,
  Invocation,
  CompilableProgram,
  Bounds as VMBounds,
} from '@glimmer/interfaces';
import { PathReference, Tag, isConst, createTag } from '@glimmer/reference';

import { Capabilities } from '../capabilities';
import { RootReference } from '../../references';
import Bounds from '../bounds';
import { JitComponentDefinition, AotComponentDefinition } from '../component-definition';

export const CAPABILITIES: ComponentCapabilities = {
  createInstance: true,
  dynamicLayout: false,
  dynamicTag: false,
  wrapped: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  updateHook: true,
  createCaller: false,
  dynamicScope: true,
};

export interface Capabilities {
  asyncLifecycleCallbacks: boolean;
  destructor: boolean;
  updateHook: boolean;
}

export interface Args {
  named: Dict<unknown>;
  positional: unknown[];
}

export interface ManagerDelegate<ComponentInstance> {
  capabilities: Capabilities;
  createComponent(factory: unknown, args: Args): ComponentInstance;
  getContext(instance: ComponentInstance): unknown;

  __glimmer__didRenderLayout?(instance: ComponentInstance, bounds: Bounds): void;
}

function hasDidRenderLayout<ComponentInstance>(delegate: ManagerDelegate<ComponentInstance>) {
  return typeof delegate.__glimmer__didRenderLayout === 'function';
}

export function hasAsyncLifecycleCallbacks<ComponentInstance>(
  delegate: ManagerDelegate<ComponentInstance>
): delegate is ManagerDelegateWithAsyncLifecycleCallbacks<ComponentInstance> {
  return delegate.capabilities.asyncLifecycleCallbacks;
}

export interface ManagerDelegateWithUpdateHook<ComponentInstance>
  extends ManagerDelegate<ComponentInstance> {
    capabilities: Capabilities & { updateHook: true };
    updateComponent(instance: ComponentInstance, args: Args): void;
  }

export function hasUpdateHook<ComponentInstance>(
  delegate: ManagerDelegate<ComponentInstance>
): delegate is ManagerDelegateWithUpdateHook<ComponentInstance> {
  return delegate.capabilities.updateHook;
}

export interface ManagerDelegateWithAsyncLifecycleCallbacks<ComponentInstance>
  extends ManagerDelegate<ComponentInstance> {
  didCreateComponent(instance: ComponentInstance): void;
  didUpdateComponent(instance: ComponentInstance): void;
}

export function hasDestructors<ComponentInstance>(
  delegate: ManagerDelegate<ComponentInstance>
): delegate is ManagerDelegateWithDestructors<ComponentInstance> {
  return delegate.capabilities.destructor;
}

export interface ManagerDelegateWithDestructors<ComponentInstance>
  extends ManagerDelegate<ComponentInstance> {
  destroyComponent(instance: ComponentInstance): void;
}

export interface ComponentArguments {
  positional: unknown[];
  named: Dict<unknown>;
}

export interface TemplateMeta {

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

export interface EnvironmentWithOwner extends Environment {
  getOwner(): Owner;
  setOwner(obj: Object, owner: Owner): void;
}

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
    _env: EnvironmentWithOwner,
    definition: CustomComponentDefinitionState<ComponentInstance>,
    args: VMArguments
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
          `You attempted to set ${definition.ComponentClass.class}#${String(
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

    const component = delegate.createComponent(definition.ComponentClass.class, value);

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
    if (hasAsyncLifecycleCallbacks(delegate)) {
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
  }: CustomComponentDefinitionState<ComponentInstance>): ComponentCapabilities {
    return Object.assign({}, CAPABILITIES, {
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

  didRenderLayout({ delegate, component }: CustomComponentState<ComponentInstance>, bounds: VMBounds) {
    if (hasDidRenderLayout(delegate)) {
      delegate.__glimmer__didRenderLayout(component, new Bounds(bounds));
    }
  }

  didUpdateLayout() {}

  getJitStaticLayout({ definition }: CustomComponentDefinitionState<ComponentInstance>): CompilableProgram {
    return definition.template.asLayout();
  }

  getAotStaticLayout({ definition }: CustomComponentDefinitionState<ComponentInstance>): Invocation {
    const { handle, symbolTable } = definition;
    return {
      handle,
      symbolTable
    };
  }
}

/**
 * Stores internal state about a component instance after it's been created.
 */
export class CustomComponentState<ComponentInstance> {
  constructor(
    public delegate: ManagerDelegate<ComponentInstance>,
    public component: ComponentInstance,
    public args: CapturedArguments,
    public namedArgsProxy?: {}
  ) {}

  destroy() {
    const { delegate, component } = this;

    if (hasDestructors(delegate)) {
      delegate.destroyComponent(component);
    }
  }
}

export interface CustomComponentDefinitionState<ComponentInstance> {
  name: string;
  delegate: ManagerDelegate<ComponentInstance>;
  ComponentClass: ComponentFactory;
  definition: CustomComponentDefinition<ComponentInstance>;
}

const CUSTOM_COMPONENT_MANAGER = new CustomComponentManager();

export class CustomComponentDefinition<ComponentInstance> implements AotComponentDefinition, JitComponentDefinition {
  public state: CustomComponentDefinitionState<ComponentInstance>;
  public manager = CUSTOM_COMPONENT_MANAGER as CustomComponentManager<ComponentInstance>;
  public handle: number;
  public symbolTable: ProgramSymbolTable;
  public template: Template;

  constructor(
    name: string,
    ComponentClass: ComponentFactory,
    delegate: ManagerDelegate<ComponentInstance>,
    templateOrHandle: Template | number,
    symbolTable?: ProgramSymbolTable
  ) {
    if (typeof templateOrHandle === 'number') {
      this.handle = templateOrHandle;
      this.symbolTable = symbolTable;
    } else {
      this.template = templateOrHandle;
    }

    this.state = {
      name,
      ComponentClass,
      delegate,
      definition: this
    };
  }
}

export interface ComponentFactory<C = {}> {
  class: C;
}