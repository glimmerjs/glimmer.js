import { Tag, DirtyableTag, TagWrapper, combine } from '@glimmer/reference';
import { dict, Dict } from '@glimmer/util';

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
      installTrackedProperty(target, key);
    }
  }
}

function descriptorForTrackedComputedProperty(target: any, key: any, descriptor: PropertyDescriptor, dependencies: string[]): PropertyDescriptor {
  let meta = metaFor(target);
  meta.trackedProperties[key] = true;
  meta.trackedPropertyDependencies[key] = dependencies || [];

  return {
    enumerable: true,
    configurable: false,
    get: descriptor.get,
    set: function() {
      metaFor(this).dirtyableTagFor(key).inner.dirty();
      descriptor.set.apply(this, arguments);
      propertyDidChange();
    }
  }
}

export type Key = string;

/**
  Installs a getter/setter for change tracking. The accessor
  acts just like a normal property, but it triggers the `propertyDidChange`
  hook when written to.

  Values are saved on the object using a "shadow key," or a symbol based on the
  tracked property name. Sets write the value to the shadow key, and gets read
  from it.
 */
function installTrackedProperty(target: any, key: Key) {
  let value: any;
  let shadowKey = Symbol(key);

  let meta = metaFor(target);
  meta.trackedProperties[key] = true;

  if (target[key] !== undefined) {
    value = target[key];
  }

  Object.defineProperty(target, key, {
    configurable: true,

    get() {
      return this[shadowKey];
    },

    set(newValue) {
      metaFor(this).dirtyableTagFor(key).inner.dirty();
      this[shadowKey] = newValue;
      propertyDidChange();
    }
  });
}

/**
 * Stores bookkeeping information about tracked properties on the target object
 * and includes helper methods for manipulating and retrieving that data.
 *
 * Computed properties (i.e., tracked getters/setters) deserve some explanation.
 * A computed property is invalidated when either it is set, or one of its
 * dependencies is invalidated. Therefore, we store two tags for each computed
 * property:
 *
 * 1. The dirtyable tag that we invalidate when the setter is invoked.
 * 2. A union tag (tag combinator) of the dirtyable tag and all of the computed
 *    property's dependencies' tags, used by Glimmer to determine "does this
 *    computed property need to be recomputed?"
 */
export default class Meta {
  tags: Dict<Tag>;
  computedPropertyTags: Dict<TagWrapper<DirtyableTag>>;
  trackedProperties: Dict<boolean>;
  trackedPropertyDependencies: Dict<string[]>;

  constructor(parent: Meta) {
    this.tags = dict<Tag>();
    this.computedPropertyTags = dict<TagWrapper<DirtyableTag>>();
    this.trackedProperties = parent ? Object.create(parent.trackedProperties) : dict<boolean>();
    this.trackedPropertyDependencies = parent ? Object.create(parent.trackedPropertyDependencies) : dict<string[]>();
  }

  /**
   * The tag representing whether the given property should be recomputed. Used
   * by e.g. Glimmer VM to detect when a property should be re-rendered. Think
   * of this as the "public-facing" tag.
   *
   * For static tracked properties, this is a single DirtyableTag. For computed
   * properties, it is a combinator of the property's DirtyableTag as well as
   * all of its dependencies' tags.
   */
  tagFor(key: Key): Tag {
    let tag = this.tags[key];
    if (tag) { return tag; }

    let dependencies;
    if (dependencies = this.trackedPropertyDependencies[key]) {
      return this.tags[key] = combinatorForComputedProperties(this, key, dependencies);
    }

    return this.tags[key] = DirtyableTag.create();
  }

  /**
   * The tag used internally to invalidate when a tracked property is set. For
   * static properties, this is the same DirtyableTag returned from `tagFor`.
   * For computed properties, it is the DirtyableTag used as one of the tags in
   * the tag combinator of the CP and its dependencies.
  */
  dirtyableTagFor(key: Key): TagWrapper<DirtyableTag> {
    let dependencies = this.trackedPropertyDependencies[key];
    let tag;

    if (dependencies) {
      // The key is for a computed property.
      tag = this.computedPropertyTags[key];
      if (tag) { return tag; }
      return this.computedPropertyTags[key] = DirtyableTag.create();
    } else {
      // The key is for a static property.
      tag = this.tags[key];
      if (tag) { return tag as TagWrapper<DirtyableTag>; }
      return this.tags[key] = DirtyableTag.create();
    }
  }
}

function combinatorForComputedProperties(meta: Meta, key: Key, dependencies: Key[] | void): Tag {
  // Start off with the tag for the CP's own dirty state.
  let tags: Tag[] = [meta.dirtyableTagFor(key)];

  // Next, add in all of the tags for its dependencies.
  if (dependencies && dependencies.length) {
    for (let i = 0; i < dependencies.length; i++) {
      tags.push(meta.tagFor(dependencies[i]));
    }
  }

  // Return a combinator across the CP's tags and its dependencies' tags.
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
  if (!meta.trackedProperties[key]) { return false; }
  return true;
}

export class UntrackedPropertyError extends Error {
  constructor(public target: any, public key: string) {
    super();
  }
}

export function tagForProperty(obj: any, key: string): Tag {
  if (!hasTag(obj, key)) {
    throw new UntrackedPropertyError(obj, key);
  }

  let meta = metaFor(obj);
  return meta.tagFor(key);
}