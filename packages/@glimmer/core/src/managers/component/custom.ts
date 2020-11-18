import { assert, unwrapTemplate } from '@glimmer/util';
import {
  InternalComponentManager,
  InternalComponentCapabilities,
  VMArguments,
  CapturedArguments,
  WithStaticLayout,
  Template,
  TemplateOk,
  Environment,
  DynamicScope,
  ComponentManager,
  ComponentManagerWithUpdateHook,
  ComponentManagerWithAsyncLifeCycleCallbacks,
  ComponentCapabilitiesVersions,
  ComponentCapabilities,
  ComponentManagerWithAsyncUpdateHook,
  ComponentManagerWithDestructors,
} from '@glimmer/interfaces';
import { valueForRef, createConstRef, Reference } from '@glimmer/reference';
import { OWNER_KEY, DEFAULT_OWNER } from '../../owner';

import { TemplateArgs } from '../../interfaces';
import { argsProxyFor } from '../util';
import { registerDestructor, getComponentManager, buildCapabilities } from '@glimmer/runtime';

export const VM_CAPABILITIES: InternalComponentCapabilities = {
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

export function capabilities<Version extends keyof ComponentCapabilitiesVersions>(
  managerAPI: Version,
  options: ComponentCapabilitiesVersions[Version] = {}
): ComponentCapabilities {
  assert(
    managerAPI === '3.4' || managerAPI === '3.13',
    'Invalid component manager compatibility specified'
  );

  let updateHook = true;

  if (managerAPI === '3.13') {
    updateHook = Boolean((options as ComponentCapabilitiesVersions['3.13']).updateHook);
  }

  return buildCapabilities({
    asyncLifeCycleCallbacks: Boolean(options.asyncLifecycleCallbacks),
    destructor: Boolean(options.destructor),
    updateHook,
  });
}

///////////

export function hasAsyncLifecycleCallbacks<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithAsyncLifeCycleCallbacks<ComponentInstance> {
  return delegate.capabilities.asyncLifeCycleCallbacks;
}

export function hasUpdateHook<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithUpdateHook<ComponentInstance> {
  return delegate.capabilities.updateHook;
}

export function hasAsyncUpdateHook<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithAsyncUpdateHook<ComponentInstance> {
  return hasAsyncLifecycleCallbacks(delegate) && hasUpdateHook(delegate);
}

export function hasDestructors<ComponentInstance>(
  delegate: ComponentManager<ComponentInstance>
): delegate is ComponentManagerWithDestructors<ComponentInstance> {
  return delegate.capabilities.destructor;
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
    InternalComponentManager<
      VMCustomComponentState<ComponentInstance>,
      VMCustomComponentDefinitionState<ComponentInstance>
    >,
    WithStaticLayout<
      VMCustomComponentState<ComponentInstance>,
      VMCustomComponentDefinitionState<ComponentInstance>
    > {
  create(
    env: Environment,
    definition: VMCustomComponentDefinitionState<ComponentInstance>,
    args: VMArguments,
    dynamicScope: DynamicScope
  ): VMCustomComponentState<ComponentInstance> {
    const { ComponentDefinition } = definition;
    const capturedArgs = args.capture();
    const owner = valueForRef(dynamicScope.get(OWNER_KEY)) as object;
    const delegate = getComponentManager(owner, ComponentDefinition) as ComponentManager<
      ComponentInstance
    >;

    const argsProxy = argsProxyFor(capturedArgs, 'component');
    const component = delegate.createComponent(ComponentDefinition, argsProxy);

    return new VMCustomComponentState(env, delegate, component, capturedArgs, argsProxy);
  }

  update({ delegate, component, argsProxy }: VMCustomComponentState<ComponentInstance>): void {
    if (hasUpdateHook(delegate)) {
      delegate.updateComponent(component, argsProxy);
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

  getDebugName(state: VMCustomComponentDefinitionState<ComponentInstance>): string {
    // TODO: This should likely call `delegate.getDebugName` somehow
    return String(state.ComponentDefinition);
  }

  getSelf({ delegate, component }: VMCustomComponentState<ComponentInstance>): Reference<unknown> {
    return createConstRef(delegate.getContext(component) as object, 'this');
  }

  getDestroyable(state: VMCustomComponentState<ComponentInstance>): object {
    return state;
  }

  getCapabilities({
    capabilities,
  }: VMCustomComponentDefinitionState<ComponentInstance>): InternalComponentCapabilities {
    return Object.assign({}, VM_CAPABILITIES, {
      updateHook: capabilities.updateHook,
    });
  }

  didRenderLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
  didUpdateLayout(): void {} // eslint-disable-line @typescript-eslint/no-empty-function

  getStaticLayout({ definition }: VMCustomComponentDefinitionState<ComponentInstance>): Template {
    return definition.template;
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
    public argsProxy: TemplateArgs
  ) {
    if (hasDestructors(delegate)) {
      registerDestructor(this, () => delegate.destroyComponent(component));
    }
  }
}

export interface VMCustomComponentDefinitionState<ComponentInstance> {
  ComponentDefinition: ComponentDefinition<ComponentInstance>;
  capabilities: ComponentCapabilities;
  definition: VMCustomComponentDefinition<ComponentInstance>;
}

export const CUSTOM_COMPONENT_MANAGER = new CustomComponentManager();

export class VMCustomComponentDefinition<ComponentInstance> {
  public state: VMCustomComponentDefinitionState<ComponentInstance>;
  public manager = CUSTOM_COMPONENT_MANAGER as CustomComponentManager<ComponentInstance>;
  public template: TemplateOk;
  public handle: number;

  constructor(
    handle: number,
    ComponentDefinition: ComponentDefinition<ComponentInstance>,
    template: Template
  ) {
    this.handle = handle;
    this.template = unwrapTemplate(template);

    const manager = getComponentManager(DEFAULT_OWNER, ComponentDefinition) as ComponentManager<
      ComponentInstance
    >;
    const capabilities = manager.capabilities;

    this.state = {
      ComponentDefinition,
      capabilities,
      definition: this,
    };
  }
}

export type ComponentDefinition<_Instance = unknown> = {};
