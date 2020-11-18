import { HelperManager, HelperDefinition } from './helper';

type ManagedItemDefinition<StateBucket> = HelperDefinition<StateBucket>;

//////////

export type ManagerFactory<Owner extends object, D extends ManagerDelegate> = (owner: Owner) => D;

type ManagerDelegate = HelperManager<unknown>;

interface HelperManagerWrapper<Owner extends object, StateBucket> {
  factory: ManagerFactory<Owner, HelperManager<StateBucket>>;
  type: 'helper';
}

type ManagerWrapper<Owner extends object, StateBucket> = HelperManagerWrapper<Owner, StateBucket>;

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
