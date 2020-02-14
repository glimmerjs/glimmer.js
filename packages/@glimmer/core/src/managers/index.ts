import { ComponentManager, ComponentDefinition } from './component/custom';
import { ModifierManager, ModifierDefinition } from './modifier';

type ManagedItemDefinition<Instance> = ComponentDefinition<Instance> | ModifierDefinition<Instance>;

//////////

export type ManagerFactory<D extends ManagerDelegate> = (owner: object) => D;

type ManagerDelegate = ComponentManager<unknown> | ModifierManager<unknown>;

interface ComponentManagerWrapper<Instance> {
  factory: ManagerFactory<ComponentManager<Instance>>;
  type: 'component';
}

interface ModifierMangagerWrapper<Instance> {
  factory: ManagerFactory<ModifierManager<Instance>>;
  type: 'modifier';
}

type ManagerWrapper<Instance> =
  | ComponentManagerWrapper<Instance>
  | ModifierMangagerWrapper<Instance>;

///////////

const MANAGERS: WeakMap<object, ManagerWrapper<unknown>> = new WeakMap();
const MANAGER_INSTANCES: WeakMap<
  object,
  WeakMap<ManagerFactory<ManagerDelegate>, ManagerDelegate>
> = new WeakMap();

const getPrototypeOf = Object.getPrototypeOf;

export function setManager<Instance = unknown>(wrapper: ManagerWrapper<Instance>, obj: {}): {} {
  MANAGERS.set(obj, wrapper);
  return obj;
}

function getManager<Instance = unknown>(
  obj: ManagedItemDefinition<Instance>
): ManagerWrapper<Instance> | undefined {
  let pointer = obj;
  while (pointer !== undefined && pointer !== null) {
    const manager = MANAGERS.get(pointer);

    if (manager !== undefined) {
      return manager as ManagerWrapper<Instance>;
    }

    pointer = getPrototypeOf(pointer);
  }

  return undefined;
}

function getManagerInstanceForOwner<D extends ManagerDelegate>(
  owner: object,
  factory: ManagerFactory<D>
): D {
  let managers = MANAGER_INSTANCES.get(owner);

  if (managers === undefined) {
    managers = new WeakMap();
    MANAGER_INSTANCES.set(owner, managers);
  }

  let instance = managers.get(factory);

  if (instance === undefined) {
    instance = factory(owner);
    managers.set(factory, instance!);
  }

  // We know for sure that it's the correct type at this point, but TS can't know
  return instance as D;
}

///////////

export function setModifierManager<Instance>(
  factory: ManagerFactory<ModifierManager<unknown>>,
  definition: ModifierDefinition<Instance>
): {} {
  return setManager({ factory, type: 'modifier' }, definition);
}

export function getModifierManager<Instance = unknown>(
  owner: object,
  definition: ModifierDefinition<Instance>
): ModifierManager<unknown> | undefined {
  const wrapper = getManager(definition);

  if (wrapper !== undefined && wrapper.type === 'modifier') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}

export function setComponentManager<Instance>(
  factory: ManagerFactory<ComponentManager<unknown>>,
  definition: ComponentDefinition<Instance>
): {} {
  return setManager({ factory, type: 'component' }, definition);
}

export function getComponentManager<Instance = unknown>(
  owner: object,
  definition: ComponentDefinition<Instance>
): ComponentManager<Instance> | undefined {
  const wrapper = getManager(definition);

  if (wrapper !== undefined && wrapper.type === 'component') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}
