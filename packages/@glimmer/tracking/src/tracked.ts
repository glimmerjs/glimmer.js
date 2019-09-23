import { DEBUG } from '@glimmer/env';
import {
  Tag,
  DirtyableTag,
  UpdatableTag,
  combine,
  CONSTANT_TAG,
  bump,
  dirty,
  createTag,
  createUpdatableTag,
  update,
} from '@glimmer/reference';
import { dict, assert } from '@glimmer/util';
import { Option, Dict } from '@glimmer/interfaces';

/**
 * An object that that tracks @tracked properties that were consumed.
 */
class Tracker {
  private tags = new Set<Tag>();

  add(tag: Tag) {
    this.tags.add(tag);
  }

  combine(): Tag {
    let { tags } = this;

    if (tags.size === 0) return CONSTANT_TAG;
    return combine(Array.from(tags));
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
 * @example
 *
 * ```typescript
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
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
 * @example Computed Properties
 *
 * In the case that you have a computed property that depends other
 * properties, tracked properties accessed within the computed property
 * will automatically be tracked for you. That means when any of those
 * dependent tracked properties is changed, a rerender of the component
 * will be scheduled.
 *
 * In the following example we have two properties,
 * `eatenApples`, and `remainingApples`.
 *
 *
 * ```typescript
 * import Component from '@glimmer/component';
 * import { tracked } from '@glimmer/tracking';
 *
 * const totalApples = 100;
 *
 * export default class MyComponent extends Component {
 *    @tracked
 *    eatenApples = 0
 *
 *    @tracked
 *    get remainingApples() {
 *      return totalApples - this.eatenApples;
 *    }
 *
 *    increment() {
 *      this.eatenApples = this.eatenApples + 1;
 *    }
 *  }
 * ```
 */
export function tracked(target: any, key: any): any;
export function tracked(target: any, key: any, descriptor: PropertyDescriptor): PropertyDescriptor;
export function tracked(...args: any[]): any {
  let [target, key, descriptor] = args;
  if (DEBUG) {
    if (typeof target === 'string') {
      throw new Error(
        `ERROR: You attempted to use @tracked with ${
          args.length > 1 ? 'arguments' : 'an argument'
        } ( @tracked(${args
          .map(d => `'${d}'`)
          .join(
            ', '
          )}) ), which is no longer necessary nor supported. Dependencies are now automatically tracked, so you can just use ${'`@tracked`'}.`
      );
    }
    if (target === undefined) {
      throw new Error(
        'ERROR: You attempted to use @tracked(), which is no longer necessary nor supported. Remove the parentheses and you will be good to go!'
      );
    }
  }

  if (!descriptor) {
    // In TypeScript's implementation, decorators on simple class fields do not
    // receive a descriptor, so we define the property on the target directly.
    Object.defineProperty(target, key, descriptorForField(target, key));
  } else if (descriptor.get) {
    // Decorator applied to a getter, e.g. `@tracked get firstName()`
    return descriptorForTrackedComputedProperty(target, key, descriptor);
  } else {
    // Decorator applied to a class field, e.g. `@tracked firstName = "Chris"`
    return descriptorForField(target, key, descriptor);
  }
}

/**
 * Whenever a tracked computed property is entered, the current tracker is
 * saved off and a new tracker is replaced.
 *
 * Any tracked properties consumed are added to the current tracker.
 *
 * When a tracked computed property is exited, the tracker's tags are
 * combined and added to the parent tracker.
 *
 * The consequence is that each tracked computed property has a tag
 * that corresponds to the tracked properties consumed inside of
 * itself, including child tracked computed properties.
 */
let CURRENT_TRACKER: Option<Tracker> = null;

export type DecoratorPropertyDescriptor = PropertyDescriptor & { initializer?: any } | undefined;

function descriptorForField(
  target: object,
  key: string,
  desc?: DecoratorPropertyDescriptor
): DecoratorPropertyDescriptor {
  assert(
    !desc || (!desc.value && !desc.get && !desc.set),
    `You attempted to use @tracked on ${key}, but that element is not a class field. @tracked is only usable on class fields. Native getters and setters will autotrack add any tracked fields they encounter, so there is no need mark getters and setters with @tracked.`
  );

  const meta = metaFor(target);
  meta.trackedProperties[key] = true;

  const initializer = desc ? desc.initializer : undefined;
  const values = new WeakMap();
  const hasInitializer = typeof initializer === 'function';

  return {
    enumerable: true,
    configurable: true,

    get(): any {
      trackedGet(this, key);

      let value;

      // If the field has never been initialized, we should initialize it
      if (hasInitializer && !values.has(this)) {
        value = initializer.call(this);
        values.set(this, value);
      } else {
        value = values.get(this);
      }

      return value;
    },

    set(newValue: any): void {
      dirty(metaFor(this).tagFor(key) as DirtyableTag);

      values.set(this, newValue);
      propertyDidChange();
    },
  };
}

function descriptorForTrackedComputedProperty(
  target: any,
  key: any,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  let meta = metaFor(target);
  meta.trackedProperties[key] = true;
  meta.trackedComputedProperties[key] = true;

  let get = descriptor.get as Function;
  let set = descriptor.set as Function;

  function getter(this: any) {
    // Swap the parent tracker for a new tracker
    let old = CURRENT_TRACKER;
    let tracker = (CURRENT_TRACKER = new Tracker());

    // Call the getter
    let ret = get.call(this);

    // Swap back the parent tracker
    CURRENT_TRACKER = old;

    // Combine the tags in the new tracker
    let tag = tracker.combine();

    if (CURRENT_TRACKER) CURRENT_TRACKER.add(tag);
    // Update the UpdatableTag for this property with the tag for all of the
    // consumed dependencies.
    update(metaFor(this).updatableTagFor(key), tag);

    return ret;
  }

  function setter(this: object) {
    let tag = createTag();
    dirty(tag);

    // Mark the UpdatableTag for this property with the current tag.
    update(metaFor(this).updatableTagFor(key), tag);
    set.apply(this, arguments);
  }

  return {
    enumerable: true,
    configurable: false,
    get: getter,
    set: set ? setter : undefined,
  };
}

export type Key = string;

export function trackedGet(obj: Object, key: string) {
  if (CURRENT_TRACKER) CURRENT_TRACKER.add(metaFor(obj).tagFor(key));
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
  computedPropertyTags: Dict<UpdatableTag>;
  trackedProperties: Dict<boolean>;
  trackedComputedProperties: Dict<boolean>;

  constructor(parent: Meta) {
    this.tags = dict<Tag>();
    this.computedPropertyTags = dict<UpdatableTag>();
    this.trackedProperties = parent ? Object.create(parent.trackedProperties) : dict<boolean>();
    this.trackedComputedProperties = parent
      ? Object.create(parent.trackedComputedProperties)
      : dict<boolean>();
  }

  /**
   * The tag representing whether the given property should be recomputed. Used
   * by e.g. Glimmer VM to detect when a property should be re-rendered. Think
   * of this as the "public-facing" tag.
   *
   * For static tracked properties, this is a single UpdatableTag. For computed
   * properties, it is a combinator of the property's UpdatableTag as well as
   * all of its dependencies' tags.
   */
  tagFor(key: Key): Tag {
    let tag = this.tags[key];
    if (tag) {
      return tag;
    }

    if (this.trackedComputedProperties[key]) {
      return (this.tags[key] = createUpdatableTag());
    }

    return (this.tags[key] = createTag());
  }

  /**
   * The tag used internally to invalidate when a tracked property is set. For
   * static properties, this is the same UpdatableTag returned from `tagFor`.
   * For computed properties, it is the UpdatableTag used as one of the tags in
   * the tag combinator of the CP and its dependencies.
   */
  updatableTagFor(key: Key): UpdatableTag {
    return (this.tags[key] as UpdatableTag) || (this.tags[key] = createUpdatableTag());
  }
}

export interface Interceptors {
  [key: string]: boolean;
}

/**
 *  A shared WeakMap for tracking an object's Meta instance, so any metadata
 *  will be garbage collected automatically with the associated object.
 */
const META_MAP = new WeakMap();

/**
 * Returns the Meta instance for an object. If no existing Meta is found,
 * creates a new instance and returns it. An object's Meta inherits from any
 * existing Meta in its prototype chain.
 */
export function metaFor(obj: any): Meta {
  // Return the Meta for this object if we already have it.
  let meta = META_MAP.get(obj);
  if (meta) {
    return meta;
  }

  // Otherwise, we need to walk the object's prototype chain to until we find a
  // parent Meta to inherit from. If we reach the end of the chain and have not
  // found a Meta, there is nothing to inherit.
  let protoMeta = findPrototypeMeta(obj);
  meta = new Meta(protoMeta);

  // Save the object's Meta and return it.
  META_MAP.set(obj, meta);
  return meta;
}

const getPrototypeOf = Object.getPrototypeOf;

// Finds the nearest Meta instance in an object's prototype chain. Returns null
// if the end of the prototype chain is reached without finding a Meta.
function findPrototypeMeta(obj: Object): Meta | null {
  let meta = null;
  let proto = obj;

  while (!meta) {
    proto = getPrototypeOf(proto);
    if (!proto) {
      return meta;
    }
    meta = META_MAP.get(proto);
  }

  return meta;
}

let propertyDidChange = function() {};

export function setPropertyDidChange(cb: () => void) {
  propertyDidChange = cb;
}

export function hasTag(obj: any, key: string): boolean {
  return metaFor(obj).trackedProperties[key];
}

export class UntrackedPropertyError extends Error {
  static for(obj: any, key: string): UntrackedPropertyError {
    return new UntrackedPropertyError(
      obj,
      key,
      `The property '${key}' on ${obj} was changed after being rendered. If you want to change a property used in a template after the component has rendered, mark the property as a tracked property with the @tracked decorator.`
    );
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

export function tagForProperty(
  obj: any,
  key: string,
  throwError: UntrackedPropertyErrorThrower = defaultErrorThrower
): Tag {
  if (typeof obj === 'object' && obj) {
    if (DEBUG && !hasTag(obj, key)) {
      installDevModeErrorInterceptor(obj, key, throwError);
    }

    return metaFor(obj).tagFor(key);
  } else {
    return CONSTANT_TAG;
  }
}

/**
 * In development mode only, we install an ad hoc setter on properties where a
 * tag is requested (i.e., it was used in a template) without being tracked. In
 * cases where the property is set, we raise an error.
 */
function installDevModeErrorInterceptor(
  obj: object,
  key: string,
  throwError: UntrackedPropertyErrorThrower
) {
  let target = obj;
  let descriptor: Option<PropertyDescriptor> = null;

  // Find the descriptor for the current property. We may need to walk the
  // prototype chain to do so. If the property is undefined, we may never get a
  // descriptor here.
  let hasOwnDescriptor = true;
  while (target) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor) {
      break;
    }
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
        },
      });
    }
  } else {
    Object.defineProperty(obj, key, {
      set() {
        throwError(this, key);
      },
    });
  }
}
