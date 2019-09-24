import { Owner } from '@glimmer/di';
import { Option } from '@glimmer/interfaces';
import { ManagerDelegate } from './component-managers/custom';

const MANAGERS: WeakMap<object, ManagerWrapper<unknown>> = new WeakMap();

const getPrototypeOf = Object.getPrototypeOf;

export type ManagerFactory<ManagerDelegate> = (owner: Owner) => ManagerDelegate;

export interface ManagerWrapper<ManagerDelegate> {
  factory: ManagerFactory<ManagerDelegate>;
  internal: boolean;
  type: 'component' | 'modifier';
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

export function setComponentManager(factory: ManagerFactory<ManagerDelegate<unknown>>, obj: {}) {
  return setManager({ factory, internal: false, type: 'component' }, obj);
}

export function getComponentManager<T>(obj: any): undefined | ManagerFactory<ManagerDelegate<T>> {
  let wrapper = getManager<ManagerDelegate<T>>(obj);

  if (wrapper && !wrapper.internal && wrapper.type === 'component') {
    return wrapper.factory;
  } else {
    return undefined;
  }
}