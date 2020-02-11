import { ComponentManager } from './component/custom';
import { ModifierManager } from './modifier';

export type ManagerFactory<D extends ManagerDelegate> = (owner: object) => D;

type ManagerDelegate = ComponentManager<unknown> | ModifierManager<unknown>;

interface ComponentManagerWrapper {
  factory: ManagerFactory<ComponentManager<unknown>>;
  type: 'component';
}

interface ModifierMangagerWrapper {
  factory: ManagerFactory<ModifierManager<unknown>>;
  type: 'modifier';
}

type ManagerWrapper = ComponentManagerWrapper | ModifierMangagerWrapper;

///////////

const MANAGERS: WeakMap<object, ManagerWrapper> = new WeakMap();
const MANAGER_INSTANCES: WeakMap<
  object,
  WeakMap<ManagerFactory<ManagerDelegate>, ManagerDelegate>
> = new WeakMap();

const getPrototypeOf = Object.getPrototypeOf;

export function setManager(wrapper: ManagerWrapper, obj: {}): {} {
  MANAGERS.set(obj, wrapper);
  return obj;
}

function getManager(obj: object): ManagerWrapper | undefined {
  let pointer = obj;
  while (pointer !== undefined && pointer !== null) {
    const manager = MANAGERS.get(pointer);

    if (manager !== undefined) {
      return manager;
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

export function setModifierManager(factory: ManagerFactory<ModifierManager<unknown>>, obj: {}): {} {
  return setManager({ factory, type: 'modifier' }, obj);
}

export function getModifierManager(owner: object, obj: {}): ModifierManager<unknown> | undefined {
  const wrapper = getManager(obj);

  if (wrapper !== undefined && wrapper.type === 'modifier') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}

export function setComponentManager(factory: ManagerFactory<ComponentManager<unknown>>, obj: {}): {} {
  return setManager({ factory, type: 'component' }, obj);
}

export function getComponentManager(
  owner: {},
  obj: {}
): ComponentManager<unknown> | undefined {
  const wrapper = getManager(obj);

  if (wrapper !== undefined && wrapper.type === 'component') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}
