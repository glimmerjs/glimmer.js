import { ComponentManager, ComponentDefinition } from './component/custom';
import { ModifierManager, ModifierDefinition } from './modifier';
import { HelperManager, HelperDefinition } from './helper';

type ManagedItemDefinition<StateBucket> =
  | ComponentDefinition<StateBucket>
  | ModifierDefinition<StateBucket>
  | HelperDefinition<StateBucket>;

//////////

export type ManagerFactory<Owner extends object, D extends ManagerDelegate> = (owner: Owner) => D;

type ManagerDelegate =
  | ComponentManager<unknown>
  | ModifierManager<unknown>
  | HelperManager<unknown>;

interface ComponentManagerWrapper<Owner extends object, StateBucket> {
  factory: ManagerFactory<Owner, ComponentManager<StateBucket>>;
  type: 'component';
}

interface ModifierMangagerWrapper<Owner extends object, StateBucket> {
  factory: ManagerFactory<Owner, ModifierManager<StateBucket>>;
  type: 'modifier';
}

interface HelperManagerWrapper<Owner extends object, StateBucket> {
  factory: ManagerFactory<Owner, HelperManager<StateBucket>>;
  type: 'helper';
}

type ManagerWrapper<Owner extends object, StateBucket> =
  | ComponentManagerWrapper<Owner, StateBucket>
  | ModifierMangagerWrapper<Owner, StateBucket>
  | HelperManagerWrapper<Owner, StateBucket>;

///////////

const MANAGERS: WeakMap<object, ManagerWrapper<object, unknown>> = new WeakMap();
const MANAGER_INSTANCES: WeakMap<
  object,
  WeakMap<ManagerFactory<object, ManagerDelegate>, ManagerDelegate>
> = new WeakMap();

const getPrototypeOf = Object.getPrototypeOf;

export function setManager<Def extends object, Owner extends object, StateBucket = unknown>(
  wrapper: ManagerWrapper<Owner, StateBucket>,
  obj: Def
): Def {
  MANAGERS.set(obj, wrapper);
  return obj;
}

function getManager<Instance = unknown>(
  obj: ManagedItemDefinition<Instance>
): ManagerWrapper<object, Instance> | undefined {
  let pointer = obj;
  while (pointer !== undefined && pointer !== null) {
    const manager = MANAGERS.get(pointer);

    if (manager !== undefined) {
      return manager as ManagerWrapper<object, Instance>;
    }

    pointer = getPrototypeOf(pointer);
  }

  return undefined;
}

function getManagerInstanceForOwner<D extends ManagerDelegate>(
  owner: object,
  factory: ManagerFactory<object, D>
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

export function setModifierManager<
  StateBucket,
  Def extends ModifierDefinition<StateBucket>,
  Owner extends object = object
>(factory: ManagerFactory<Owner, ModifierManager<StateBucket>>, definition: Def): Def {
  return setManager({ factory, type: 'modifier' }, definition);
}

export function getModifierManager<StateBucket = unknown>(
  owner: object,
  definition: ModifierDefinition<StateBucket>
): ModifierManager<StateBucket> | undefined {
  const wrapper = getManager(definition);

  if (wrapper !== undefined && wrapper.type === 'modifier') {
    return getManagerInstanceForOwner(owner, wrapper.factory);
  }
}

export function setHelperManager<
  StateBucket,
  Def extends HelperDefinition<StateBucket>,
  Owner extends object = object
>(factory: ManagerFactory<Owner, HelperManager<StateBucket>>, definition: Def): Def {
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

export function setComponentManager<
  StateBucket,
  Def extends ComponentDefinition<StateBucket>,
  Owner extends object = object
>(factory: ManagerFactory<Owner, ComponentManager<StateBucket>>, definition: Def): Def {
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
