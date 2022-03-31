import { DEBUG } from '@glimmer/env';
import { dict } from '@glimmer/util';
import { Option } from '@glimmer/interfaces';
import {
  PathReference,
  ConstReference,
  CachedReference,
} from '@glimmer/reference';
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

export function trackProperty<T = unknown>(obj: {}, key: string, throwError = defaultErrorThrower): [T, Tag] {
  if (DEBUG && typeof obj === 'object') {
    installDevModeErrorInterceptor(obj, key, throwError);
  }
  let value;
  const tag = track(() => { value = obj[key]; });
  return [value, tag];
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
    // Only install the interceptor if it's a simple (non-getter) property and
    // the existing property is able to be configured.
    if (descriptor.hasOwnProperty('value') && (descriptor.configurable || !hasOwnDescriptor)) {
      Object.defineProperty(obj, key, {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,

        get() {
          return descriptor.value;
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

  get(key: string): PathReference<any> {
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
  static create(parentReference: PathReference<any>, propertyKey: string) {
    if (isConst(parentReference)) {
      return new RootPropertyReference(parentReference.value(), propertyKey);
    } else {
      return new NestedPropertyReference(parentReference, propertyKey);
    }
  }

  get(key: string): PathReference<any> {
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

    // This is a type error in recent versions of TS, but/and it should be
    // resolved on the v2 branch, rather than against v1.x.
    // @ts-ignore
    return value;
  }
}

export class NestedPropertyReference<T> extends PropertyReference<T> {
  public tag: Tag;
  private propertyTag: UpdatableTag;

  constructor(private parentReference: PathReference<any>, private propertyKey: string) {
    super();

    let parentReferenceTag = parentReference.tag;
    let propertyTag = (this.propertyTag = createUpdatableTag());

    this.tag = combine([parentReferenceTag, propertyTag]);
  }

  // This is patently nonsense, but/and it is resolved on the v2 branch.
  // @ts-ignore
  compute() {
    let { parentReference, propertyTag, propertyKey } = this;

    let parentValue = parentReference.value();
    let parentValueType = typeof parentValue;

    if (parentValueType === 'string' && propertyKey === 'length') {
      return (parentValue as string).length;
    }

    if ((parentValueType === 'object' && parentValue !== null) || parentValueType === 'function') {
      const [value, tag] = trackProperty(parentValue, propertyKey);

      consume(tag);
      update(propertyTag, tag);

      return value;
    } else {
      return undefined;
    }
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
    let { _value } = this;

    if (value !== _value) {
      dirty(this.tag);
      this._value = value;
    }
  }
}

export class ConditionalReference extends GlimmerConditionalReference {
  static create(reference: PathReference<any>) {
    if (isConst(reference)) {
      let value = reference.value();
      return PrimitiveReference.create(value);
    }

    return new GlimmerConditionalReference(reference);
  }
}

export class TemplateOnlyComponentDebugReference extends ConstReference<void> {
  constructor(protected name: string) {
    super(undefined);
  }

  get(propertyKey: string): PathReference<unknown> {
    throw new Error(
      `You tried to reference {{${propertyKey}}} from the ${
        this.name
      } template, which doesn't have an associated component class. Template-only components can only access args passed to them. Did you mean {{@${propertyKey}}}?`
    );
  }
}
