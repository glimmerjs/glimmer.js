import { DEBUG } from "@glimmer/env";
import { Tag, DirtyableTag, UpdatableTag, TagWrapper, combine, CONSTANT_TAG, CURRENT_TAG } from "@glimmer/reference";
import { dict, Dict, Option } from "@glimmer/util";

class Tracker {
  private tags = new Set<Tag>();

  add(tag: Tag) {
    this.tags.add(tag);
  }

  combine(): Tag {
    let tags: Tag[] = [];
    this.tags.forEach(tag => tags.push(tag));
    return combine(tags);
  }
}

/**
 * @decorator
 *
 * Marks a property as tracked.
 *
 * By default, a component's properties are expected to be static,
 * meaning you are not able to update them and have the template update accordingly.
 * Marking a property as tracked means that when that property changes,
 * a rerender of the component is scheduled so the template is kept up to date.
 *
 * There are two usages for the `@tracked` decorator, shown below.
 *
 * @example No dependencies
 *
 * If you don't pass an argument to `@tracked`, only changes to that property
 * will be tracked:
 *
 * ```typescript
 * import Component, { tracked } from '@glimmer/component';
 *
 * export default class MyComponent extends Component {
 *    @tracked
 *    remainingApples = 10
 * }
 * ```
 *
 * When something changes the component's `remainingApples` property, the rerender
 * will be scheduled.
 *
 * @example Dependents
 *
 * In the case that you have a computed property that depends other
 * properties, you want to track both so that when one of the
 * dependents change, a rerender is scheduled.
 *
 * In the following example we have two properties,
 * `eatenApples`, and `remainingApples`.
 *
 *
 * ```typescript
 * import Component, { tracked } from '@glimmer/component';
 *
 * const totalApples = 100;
 *
 * export default class MyComponent extends Component {
 *    @tracked
 *    eatenApples = 0
 *
 *    @tracked('eatenApples')
 *    get remainingApples() {
 *      return totalApples - this.eatenApples;
 *    }
 *
 *    increment() {
 *      this.eatenApples = this.eatenApples + 1;
 *    }
 *  }
 * ```
 *
 * @param dependencies Optional dependents to be tracked.
 */
export function tracked(...dependencies: string[]): MethodDecorator;
export function tracked(target: any, key: any): any;
export function tracked(target: any, key: any, descriptor: PropertyDescriptor): PropertyDescriptor;
export function tracked(...dependencies: any[]): any {
  let [target, key, descriptor] = dependencies;

  if (typeof target === "string") {
    return function(target: any, key: string | Symbol, descriptor: PropertyDescriptor) {
      return descriptorForTrackedComputedProperty(target, key, descriptor, dependencies);
    };
  } else {
    if (descriptor) {
      return descriptorForTrackedComputedProperty(target, key, descriptor, []);
    } else {
      installTrackedProperty(target, key);
    }
  }
}

let CURRENT_TRACKER: Option<Tracker> = null;

function descriptorForTrackedComputedProperty(target: any, key: any, descriptor: PropertyDescriptor, dependencies: string[]): PropertyDescriptor {
  let meta = metaFor(target);
  meta.trackedProperties[key] = true;
  meta.trackedPropertyDependencies[key] = dependencies || [];

  let get = descriptor.get as Function;
  let set = descriptor.set as Function;

  function getter(this: any) {
    let old = CURRENT_TRACKER;
    let tracker = CURRENT_TRACKER = new Tracker();

    let ret = get.call(this);

    CURRENT_TRACKER = old;
    let tag = tracker.combine();
    if (CURRENT_TRACKER) CURRENT_TRACKER.add(tag);
    metaFor(this).updatableTagFor(key).inner.update(tag);
    return ret;
  }

  return {
    enumerable: true,
    configurable: false,
    get: getter,
    set: function() {
      EPOCH.inner.dirty();
      metaFor(this).updatableTagFor(key).inner.update(CURRENT_TAG);
      set.apply(this, arguments);
    }
  };
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
      if (CURRENT_TRACKER) CURRENT_TRACKER.add(metaFor(this).updatableTagFor(key));
      return this[shadowKey];
    },

    set(newValue) {
      EPOCH.inner.dirty();
      metaFor(this).updatableTagFor(key).inner.update(CURRENT_TAG);
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
  computedPropertyTags: Dict<TagWrapper<UpdatableTag>>;
  trackedProperties: Dict<boolean>;
  trackedPropertyDependencies: Dict<string[]>;

  constructor(parent: Meta) {
    this.tags = dict<Tag>();
    this.computedPropertyTags = dict<TagWrapper<UpdatableTag>>();
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
  updatableTagFor(key: Key): TagWrapper<UpdatableTag> {
    let dependencies = this.trackedPropertyDependencies[key];
    let tag;

    if (dependencies) {
      // The key is for a computed property.
      tag = this.computedPropertyTags[key];
      if (tag) { return tag; }
      return this.computedPropertyTags[key] = UpdatableTag.create(CURRENT_TAG);
    } else {
      // The key is for a static property.
      tag = this.tags[key];
      if (tag) { return tag as TagWrapper<UpdatableTag>; }
      return this.tags[key] = UpdatableTag.create(CURRENT_TAG);
    }
  }
}

function combinatorForComputedProperties(meta: Meta, key: Key, dependencies: Key[] | void): Tag {
  // Start off with the tag for the CP's own dirty state.
  let tags: Tag[] = [meta.updatableTagFor(key)];

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

const EPOCH = DirtyableTag.create();

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
  static for(obj: any, key: string): UntrackedPropertyError {
    return new UntrackedPropertyError(obj, key, `The property '${key}' on ${obj} was changed after being rendered. If you want to change a property used in a template after the component has rendered, mark the property as a tracked property with the @tracked decorator.`);
  }

  constructor(public target: any, public key: string, message: string) {
    super(message);
  }
}

/**
 * Function that can be used in development mode to generate more meaningful
 * error messages.
 */
export interface UntrackedPropertyErrorThrower {
  (obj: any, key: string): void;
}

function defaultErrorThrower(obj: any, key: string): UntrackedPropertyError {
  throw UntrackedPropertyError.for(obj, key);
}

export function tagForProperty(obj: any, key: string, throwError: UntrackedPropertyErrorThrower = defaultErrorThrower): Tag {
  if (typeof obj === "object" && obj) {
    if (DEBUG && !hasTag(obj, key)) {
      installDevModeErrorInterceptor(obj, key, throwError);
    }

    let meta = metaFor(obj);
    return meta.tagFor(key);
  } else {
    return CONSTANT_TAG;
  }
}

/**
 * In development mode only, we install an ad hoc setter on properties where a
 * tag is requested (i.e., it was used in a template) without being tracked. In
 * cases where the property is set, we raise an error.
 */
function installDevModeErrorInterceptor(obj: object, key: string, throwError: UntrackedPropertyErrorThrower) {
  let target = obj;
  let descriptor: Option<PropertyDescriptor> = null;

  // Find the descriptor for the current property. We may need to walk the
  // prototype chain to do so. If the property is undefined, we may never get a
  // descriptor here.
  let hasOwnDescriptor = true;
  while (target) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor) { break; }
    hasOwnDescriptor = false;
    target = Object.getPrototypeOf(target);
  }

  // If possible, define a property descriptor that passes through the current
  // value on reads but throws an exception on writes.
  if (descriptor) {
    let { get, value } = descriptor;

    if (descriptor.configurable || !hasOwnDescriptor) {
      Object.defineProperty(obj, key, {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,

        get() {
          if (get) {
            return get.call(this);
          } else {
            return value;
          }
        },

        set() {
          throwError(this, key);
        }
      });
    }
  } else {
    Object.defineProperty(obj, key, {
      set() {
        throwError(this, key);
      }
    });
  }
}
