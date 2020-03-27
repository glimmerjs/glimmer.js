import { consume, tagFor, dirtyTagFor } from '@glimmer/validator';

const COLLECTION = Symbol();

function createProxy(obj = {}) {

  return new Proxy(obj, {
    get(target, prop) {
      consume(tagFor(target, prop));

      return target[prop];
    },

    has(target, prop) {
      consume(tagFor(target, prop));

      return prop in target;
    },

    ownKeys(target) {
      consume(tagFor(target, COLLECTION));

      return Reflect.ownKeys(target);
    },

    set(target, prop, value) {
      target[prop] = value;

      dirtyTagFor(target, prop);
      dirtyTagFor(target, COLLECTION);

      return true;
    },

    getPrototypeOf() {
      return TrackedObject.prototype;
    },
  });
}

export default class TrackedObject {
  static fromEntries(entries) {
    return createProxy(Object.fromEntries(entries));
  }

  constructor(obj = {}) {
    let proto = Object.getPrototypeOf(obj);
    let descs = Object.getOwnPropertyDescriptors(obj)

    let clone = Object.create(proto);

    for (let prop in descs) {
      Object.defineProperty(clone, prop, descs[prop]);
    }

    return createProxy(clone);
  }
}
