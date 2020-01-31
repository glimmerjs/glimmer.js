import { Owner } from '@glimmer/di';
import { Option } from '@glimmer/interfaces';
import { ComponentManager } from './component-managers/custom';

const MANAGERS: WeakMap<object, ManagerWrapper<unknown>> = new WeakMap();

const getPrototypeOf = Object.getPrototypeOf;

export type ManagerFactory<ManagerDelegate> = (owner: Owner) => ManagerDelegate;

export interface ManagerWrapper<ManagerDelegate> {
  factory: ManagerFactory<ManagerDelegate>;
  type: 'component';
}

export function setManager<ManagerDelegate>(wrapper: ManagerWrapper<ManagerDelegate>, obj: {}) {
  MANAGERS.set(obj, wrapper);
  return obj;
}

export function getManager<ManagerDelegate>(obj: object): Option<ManagerWrapper<ManagerDelegate>> {
  let pointer = obj;
  while (pointer !== undefined && pointer !== null) {
    let manager = MANAGERS.get(pointer);

    if (manager !== undefined) {
      return manager as ManagerWrapper<ManagerDelegate>;
    }

    pointer = getPrototypeOf(pointer);
  }

  return null;
}

export function setComponentManager(factory: ManagerFactory<ComponentManager<unknown>>, obj: {}) {
  return setManager({ factory, type: 'component' }, obj);
}

export function getComponentManager<T>(obj: any): undefined | ManagerFactory<ComponentManager<T>> {
  let wrapper = getManager<ComponentManager<T>>(obj);

  if (wrapper && wrapper.type === 'component') {
    return wrapper.factory;
  } else {
    return undefined;
  }
}
