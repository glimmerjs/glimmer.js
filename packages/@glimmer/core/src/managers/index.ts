import { ComponentManager, ComponentDefinition } from './component/custom';
import { ModifierManager, ModifierDefinition } from './modifier';
import { HelperManager, HelperDefinition } from './helper';

type ManagedItemDefinition<StateBucket> =
  | ComponentDefinition<StateBucket>
  | ModifierDefinition<StateBucket>
  | HelperDefinition<StateBucket>;

//////////

export type ManagerFactory<D extends ManagerDelegate> = (owner: object) => D;

type ManagerDelegate =
  | ComponentManager<unknown>
  | ModifierManager<unknown>
  | HelperManager<unknown>;

interface ComponentManagerWrapper<StateBucket> {
  factory: ManagerFactory<ComponentManager<StateBucket>>;
  type: 'component';
}

interface ModifierMangagerWrapper<StateBucket> {
  factory: ManagerFactory<ModifierManager<StateBucket>>;
  type: 'modifier';
}

interface HelperManagerWrapper<StateBucket> {
  factory: ManagerFactory<HelperManager<StateBucket>>;
  type: 'helper';
}

type ManagerWrapper<StateBucket> =
  | ComponentManagerWrapper<StateBucket>
  | ModifierMangagerWrapper<StateBucket>
  | HelperManagerWrapper<StateBucket>;

///////////

const MANAGERS: WeakMap<object, ManagerWrapper<unknown>> = new WeakMap();
const MANAGER_INSTANCES: WeakMap<
  object,
  WeakMap<ManagerFactory<ManagerDelegate>, ManagerDelegate>
> = new WeakMap();

const getPrototypeOf = Object.getPrototypeOf;

export function setManager<StateBucket = unknown>(wrapper: ManagerWrapper<StateBucket>, obj: {}): {} {
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

export function setModifierManager<StateBucket>(
  factory: ManagerFactory<ModifierManager<unknown>>,
  definition: ModifierDefinition<StateBucket>
): {} {
  return setManager({ factory, type: 'modifier' }, definition);
}

export function getModifierManager<StateBucket = unknown>(
  owner: object,
  definition: ModifierDefinition<StateBucket>
): ModifierManager<unknown> | undefined {
  const wrapper = getManager(definition);

  if (wrapper !== undefined && wrapper.type === 'modifier') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}

export function setHelperManager<StateBucket>(
  factory: ManagerFactory<HelperManager<StateBucket>>,
  definition: HelperDefinition<StateBucket>
): {} {
  return setManager({ factory, type: 'helper' }, definition);
}

export function getHelperManager<StateBucket = unknown>(
  owner: object,
  definition: HelperDefinition<StateBucket>
): HelperManager<StateBucket> | undefined {
  const wrapper = getManager(definition);

  if (wrapper !== undefined && wrapper.type === 'helper') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}

export function setComponentManager<StateBucket>(
  factory: ManagerFactory<ComponentManager<StateBucket>>,
  definition: ComponentDefinition<StateBucket>
): {} {
  return setManager({ factory, type: 'component' }, definition);
}

export function getComponentManager<StateBucket = unknown>(
  owner: object,
  definition: ComponentDefinition<StateBucket>
): ComponentManager<StateBucket> | undefined {
  const wrapper = getManager(definition);

  if (wrapper !== undefined && wrapper.type === 'component') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}
