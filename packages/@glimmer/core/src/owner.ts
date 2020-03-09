import { DEBUG } from '@glimmer/env';

const OWNER_MAP = new WeakMap<{}, unknown>();

export const OWNER_KEY = `__OWNER_${Math.floor(Math.random() * Date.now())}__`;

export let DEFAULT_OWNER = {};

if (DEBUG) {
  const OWNER_ERROR = 'You attempted to use the Owner for a component, modifier, or helper, but did not provide an owner to `renderComponent`.';
  DEFAULT_OWNER = new Proxy(DEFAULT_OWNER, {
    get(): never {
      throw new Error(OWNER_ERROR);
    },
    set(): never {
      throw new Error(OWNER_ERROR);
    }
  });
}

export function getOwner<T = unknown>(obj: object): T {
  return OWNER_MAP.get(obj) as T;
}

export function setOwner(obj: object, owner: unknown): void {
  OWNER_MAP.set(obj, owner);
}
