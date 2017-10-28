import {
  dict, Opaque
} from "@glimmer/util";
import {
  PathReference,
  CONSTANT_TAG,
  ConstReference,
  DirtyableTag,
  UpdatableTag,
  combine,
  isConst,
  Tag,
  TagWrapper
} from "@glimmer/reference";
import {
  ConditionalReference as GlimmerConditionalReference,
  PrimitiveReference
} from "@glimmer/runtime";
import { tagForProperty } from "./tracked";

/**
 * The base PathReference.
 */
export abstract class ComponentPathReference<T> implements PathReference<T> {
  abstract value(): T;
  abstract get tag(): Tag;

  get(key: string): PathReference<any> {
    return PropertyReference.create(this, key);
  }
}

export abstract class CachedReference<T> extends ComponentPathReference<T> {
  private _lastRevision: number | null = null;
  private _lastValue: any = null;

  abstract compute(): T;

  value() {
    let { tag, _lastRevision, _lastValue } = this;

    if (!_lastRevision || !tag.validate(_lastRevision)) {
      _lastValue = this._lastValue = this.compute();
      this._lastRevision = tag.value();
    }

    return _lastValue;
  }
}

export class RootReference extends ConstReference<object> {
  private children = dict<RootPropertyReference>();

  get(propertyKey: string): RootPropertyReference{
    let ref = this.children[propertyKey];

    if (!ref) {
      ref = this.children[propertyKey] = new RootPropertyReference(this.inner, propertyKey);
    }

    return ref;
  }
}

export abstract class PropertyReference extends CachedReference<any> {
  static create(parentReference: PathReference<any>, propertyKey: string) {
    if (isConst(parentReference)) {
      return new RootPropertyReference(parentReference.value(), propertyKey);
    } else {
      return new NestedPropertyReference(parentReference, propertyKey);
    }
  }

  get(key: string): PathReference<any>  {
    return new NestedPropertyReference(this, key);
  }
}

export class RootPropertyReference extends PropertyReference {
  tag: Tag;
  private _parentValue: object;
  private _propertyKey: string;

  constructor(parentValue: object, propertyKey: string) {
    super();

    this._parentValue = parentValue;
    this._propertyKey = propertyKey;
    this.tag = tagForProperty(parentValue, propertyKey);
  }

  compute(): any {
    return (this._parentValue as any)[this._propertyKey];
  }
}

export class NestedPropertyReference extends PropertyReference {
  public tag: Tag;
  private _parentReference: PathReference<any>;
  private _parentObjectTag: TagWrapper<UpdatableTag>;
  private _propertyKey: string;

  constructor(parentReference: PathReference<any>, propertyKey: string) {
    super();

    let parentReferenceTag = parentReference.tag;
    let parentObjectTag = UpdatableTag.create(CONSTANT_TAG);

    this._parentReference = parentReference;
    this._parentObjectTag = parentObjectTag;
    this._propertyKey = propertyKey;

    this.tag = combine([parentReferenceTag, parentObjectTag]);
  }

  compute() {
    let { _parentReference, _parentObjectTag, _propertyKey } = this;

    let parentValue = _parentReference.value();

    _parentObjectTag.inner.update(tagForProperty(parentValue, _propertyKey));

    if (typeof parentValue === "string" && _propertyKey === "length") {
      return parentValue.length;
    }

    if (typeof parentValue === "object" && parentValue) {
      return parentValue[_propertyKey];
    } else {
      return undefined;
    }
  }
}

export class UpdatableReference<T> extends ComponentPathReference<T> {
  public tag: TagWrapper<DirtyableTag>;
  private _value: T;

  constructor(value: T) {
    super();

    this.tag = DirtyableTag.create();
    this._value = value;
  }

  value() {
    return this._value;
  }

  update(value: T) {
    let { _value } = this;

    if (value !== _value) {
      this.tag.inner.dirty();
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

    return new ConditionalReference(reference);
  }
}

export class TemplateOnlyComponentDebugReference extends ConstReference<void> {
  constructor(protected name: string) {
    super(undefined);
  }

  get(propertyKey: string): PathReference<Opaque> {
    throw new Error(`You tried to reference {{${propertyKey}}} from the ${this.name} template, which doesn't have an associated component class. Template-only components can only access args passed to them. Did you mean {{@${propertyKey}}}?`);
  }
};
