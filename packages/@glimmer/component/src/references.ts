import { dict } from '@glimmer/util';
import {
  PathReference,
  ConstReference,
  DirtyableTag,
  UpdatableTag,
  combine,
  isConst,
  Tag,
  createUpdatableTag,
  CachedReference,
  update,
  createTag,
  dirty
} from '@glimmer/reference';
import {
  ConditionalReference as GlimmerConditionalReference,
  PrimitiveReference,
} from '@glimmer/runtime';
import { consume, trackProperty } from '@glimmer/tracking';

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
