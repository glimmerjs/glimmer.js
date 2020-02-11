import { DEBUG } from '@glimmer/env';
import { dict } from '@glimmer/util';
import { PathReference, ConstReference, CachedReference } from '@glimmer/reference';
import {
  DirtyableTag,
  UpdatableTag,
  combine,
  isConst,
  Tag,
  createUpdatableTag,
  update,
  createTag,
  dirty,
  track,
  consume,
} from '@glimmer/validator';
import {
  ConditionalReference as GlimmerConditionalReference,
  PrimitiveReference,
} from '@glimmer/runtime';

export function trackProperty<T = unknown>(
  obj: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  key: string,
  throwError = defaultErrorThrower
): [T, Tag] {
  if (DEBUG && typeof obj === 'object') {
    installDevModeErrorInterceptor(obj, key, throwError);
  }
  let value: T | undefined;
  const tag = track(() => {
    value = obj[key] as T;
  });
  return [value!, tag];
}

export class UntrackedPropertyError extends Error {
  static for(obj: {}, key: string): UntrackedPropertyError {
    return new UntrackedPropertyError(
      obj,
      key,
      `The property '${key}' on ${obj} was changed after being rendered. If you want to change a property used in a template after the component has rendered, mark the property as a tracked property with the @tracked decorator.`
    );
  }

  constructor(public target: {}, public key: string, message: string) {
    super(message);
  }
}

/**
 * Function that can be used in development mode to generate more meaningful
 * error messages.
 */
export interface UntrackedPropertyErrorThrower {
  (obj: {}, key: string): void;
}

function defaultErrorThrower(obj: {}, key: string): UntrackedPropertyError {
  throw UntrackedPropertyError.for(obj, key);
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
): void {
  let target = obj;
  let descriptor: PropertyDescriptor | undefined;

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
    // Only install the interceptor if it's a simple (non-getter) property and
    // the existing property is able to be configured.
    if ('value' in descriptor && (descriptor.configurable || !hasOwnDescriptor)) {
      Object.defineProperty(obj, key, {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,

        get() {
          return descriptor!.value;
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

export abstract class ComponentPathReference<T> implements PathReference<T> {
  abstract value(): T;
  abstract get tag(): Tag;

  get(key: string): PathReference<unknown> {
    return PropertyReference.create(this, key);
  }
}

export class RootReference<T extends object> extends ConstReference<T> {
  private children = dict<RootPropertyReference<unknown>>();

  get(propertyKey: string): RootPropertyReference<unknown> {
    let ref = this.children[propertyKey];

    if (!ref) {
      ref = this.children[propertyKey] = new RootPropertyReference(this.inner, propertyKey);
    }

    return ref;
  }
}

export abstract class PropertyReference<T> extends CachedReference<T> {
  static create(parentReference: PathReference<unknown>, propertyKey: string): PropertyReference<unknown> {
    if (isConst(parentReference)) {
      return new RootPropertyReference(parentReference.value() as object, propertyKey);
    }
    return new NestedPropertyReference(parentReference, propertyKey);
  }

  get(key: string): PathReference<unknown> {
    return new NestedPropertyReference(this, key);
  }
}

export class RootPropertyReference<T> extends PropertyReference<T> {
  tag = createUpdatableTag();

  constructor(private _parentValue: object, private _propertyKey: string) {
    super();
  }

  compute(): T {
    const [value, tag] = trackProperty(this._parentValue, this._propertyKey);

    consume(tag);
    update(this.tag, tag);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return value as any;
  }
}

export class NestedPropertyReference<T> extends PropertyReference<T> {
  public tag: Tag;
  private propertyTag: UpdatableTag;

  constructor(private parentReference: PathReference<unknown>, private propertyKey: string) {
    super();

    const parentReferenceTag = parentReference.tag;
    const propertyTag = (this.propertyTag = createUpdatableTag());

    this.tag = combine([parentReferenceTag, propertyTag]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compute(): any {
    const { parentReference, propertyTag, propertyKey } = this;

    const parentValue = parentReference.value();
    const parentValueType = typeof parentValue;

    if (parentValueType === 'string' && propertyKey === 'length') {
      return (parentValue as string).length;
    }

    if ((parentValueType === 'object' && parentValue !== null) || parentValueType === 'function') {
      const [value, tag] = trackProperty(parentValue, propertyKey);

      consume(tag);
      update(propertyTag, tag);

      return value;
    }
    return undefined;
  }
}

export class UpdatableReference<T> extends ComponentPathReference<T> {
  public tag: DirtyableTag;
  private _value: T;

  constructor(value: T) {
    super();

    this.tag = createTag();
    this._value = value;
  }

  value(): T {
    return this._value;
  }

  update(value: T): void {
    const { _value } = this;

    if (value !== _value) {
      dirty(this.tag);
      this._value = value;
    }
  }
}

export class ConditionalReference extends GlimmerConditionalReference {
  static create(reference: PathReference<boolean>): ConditionalReference | PrimitiveReference<boolean> {
    if (isConst(reference)) {
      const value = reference.value();
      return PrimitiveReference.create(value);
    }

    return new GlimmerConditionalReference(reference);
  }
}
