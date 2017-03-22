import { Tag, DirtyableTag, TagWrapper, combine } from '@glimmer/reference';

export function tracked(...dependencies: string[]): MethodDecorator;
export function tracked(target: any, key: any): any;
export function tracked(target: any, key: any, descriptor: PropertyDescriptor): PropertyDescriptor;
export function tracked(...dependencies: any[]): any {
  let [target, key, descriptor] = dependencies;

  if (typeof target === "string") {
    return function(target: any, key: string | Symbol, descriptor: PropertyDescriptor) {
      return descriptorForTrackedComputedProperty(target, key, descriptor, dependencies);
    }
  } else {
    if (descriptor) {
      return descriptorForTrackedComputedProperty(target, key, descriptor, []);
    } else {
      installInterceptor(target, key);
    }
  }
}

function descriptorForTrackedComputedProperty(target: any, key: any, descriptor: PropertyDescriptor, keys: string[]): PropertyDescriptor {
  let meta = metaFor(target);
  meta.trackedProperties[key] = keys;
  meta.interceptors[key] = true;

  for (let i = 0; i < keys.length; i++) {
    installInterceptor(target, keys[i]);
  }

  return {
    enumerable: true,
    configurable: false,
    get: descriptor.get,
    set: function() {
      descriptor.set.call(this, arguments);
      propertyDidChange();
    }
  }
}

export type Key = string;

export function installInterceptor(target: any, key: Key) {
  let value: any;
  let shadowKey = Symbol(key);

  let meta = metaFor(target);
  meta.interceptors[key] = true;

  if (target[key] !== undefined) {
    value = target[key];
  }

  Object.defineProperty(target, key, {
    configurable: true,

    get() {
      return this[shadowKey];
    },

    set(newValue) {
      metaFor(this).tagFor(key).inner.dirty();
      this[shadowKey] = newValue;
      propertyDidChange();
    }
  });
}

export interface Tags {
  [key: string]: Tag
}

export interface TrackedProperties {
  [key: string]: string[];
}

export default class Meta {
  tags: Tags;
  interceptors: Interceptors;
  trackedProperties: TrackedProperties;

  constructor(parent: Meta) {
    this.tags = {};
    this.interceptors = parent ? Object.create(parent.interceptors) : {};
    this.trackedProperties = parent ? Object.create(parent.trackedProperties) : {};
  }

  tagFor(key: Key): TagWrapper<DirtyableTag> {
    let tag = this.tags[key];
    if (tag) { return tag as TagWrapper<DirtyableTag>; }

    return this.tags[key] = DirtyableTag.create();
  }

  tagForComputedProperty(key: Key, obj: any): Tag {
    let tag = this.tags[key];
    if (tag) { return tag; }

    let keys = this.trackedProperties[key];
    return this.tags[key] = unionTagForKeys(this, keys);
  }
}

function unionTagForKeys(meta: Meta, keys: Key[] | void) {
  let tags = [];

  if (keys && keys.length) {
    for (let i = 0; i < keys.length; i++) {
      tags.push(meta.tagFor(keys[i]));
    }
  }

  return combine(tags);
}

export interface Interceptors {
  [key: string]: boolean;
}

let META = Symbol("ember-object");

export function metaFor(obj: any): Meta {
  let meta = obj[META];
  if (meta && hasOwnProperty(obj, META)) {
    return meta;
  }

  return obj[META] = new Meta(meta);
}

let hOP = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj: any, key: symbol) {
  return hOP.call(obj, key);
}

let propertyDidChange = function() {};

export function setPropertyDidChange(cb: () => void) {
  propertyDidChange = cb;
}

export function hasTag(obj: any, key: string): boolean {
  let meta = obj[META] as Meta;

  if (!obj[META]) { return false; }
  if (meta.trackedProperties[key]) { return true; }
  if (meta.interceptors[key]) { return true; }
  return false;
}

export function tagForProperty(obj: any, key: string): Tag {
  let meta = metaFor(obj);

  if (!meta.interceptors[key]) {
    installInterceptor(obj, key);
  }

  return meta.tagFor(key);
}