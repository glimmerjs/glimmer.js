import {
  Reference,
  OpaqueIterator,
  OpaqueIterable,
  AbstractIterable,
  IterationItem,
  Tag,
} from '@glimmer/reference';

import { UpdatableReference } from '@glimmer/component';
import { isDict } from '@glimmer/util';

export type KeyFor<T> = (item: unknown, index: T) => unknown;

class ArrayIterator implements OpaqueIterator {
  private array: unknown[];
  private keyFor: KeyFor<number>;
  private position = 0;

  constructor(array: unknown[], keyFor: KeyFor<number>) {
    this.array = array;
    this.keyFor = keyFor;
  }

  isEmpty(): boolean {
    return this.array.length === 0;
  }

  next(): IterationItem<unknown, number> | null {
    let { position, array, keyFor } = this;

    if (position >= array.length) return null;

    let value = array[position];
    let key = keyFor(value, position);
    let memo = position;

    this.position++;

    return { key, value, memo };
  }
}

class ObjectKeysIterator implements OpaqueIterator {
  private keys: string[];
  private values: unknown[];
  private keyFor: KeyFor<string>;
  private position = 0;

  constructor(keys: string[], values: unknown[], keyFor: KeyFor<string>) {
    this.keys = keys;
    this.values = values;
    this.keyFor = keyFor;
  }

  isEmpty(): boolean {
    return this.keys.length === 0;
  }

  next(): IterationItem<unknown, string> | null {
    let { position, keys, values, keyFor } = this;

    if (position >= keys.length) return null;

    let value = values[position];
    let memo = keys[position];
    let key = keyFor(value, memo);

    this.position++;

    return { key, value, memo };
  }
}

class EmptyIterator implements OpaqueIterator {
  isEmpty(): boolean {
    return true;
  }

  next(): IterationItem<unknown, unknown> {
    throw new Error(`Cannot call next() on an empty iterator`);
  }
}

const EMPTY_ITERATOR = new EmptyIterator();

// TODO: Use built-in Glimmer VM iterables
export function iterableFor(ref: Reference<unknown>, keyPath: string): OpaqueIterable {
  let keyFor: KeyFor<unknown>;

  if (!keyPath) {
    throw new Error('Must specify a key for #each');
  }

  switch (keyPath) {
    case '@index':
      keyFor = (_, index: unknown) => String(index);
      break;
    case '@primitive':
      keyFor = (item: unknown) => String(item);
      break;
    default:
      keyFor = (item: unknown) => (isDict(item) ? item[keyPath] : item);
      break;
  }

  return new Iterable(ref, keyFor);
}

/** @internal */
export default class Iterable
  implements
    AbstractIterable<
      unknown,
      unknown,
      IterationItem<unknown, unknown>,
      UpdatableReference<unknown>,
      UpdatableReference<unknown>
    > {
  public tag: Tag;
  private ref: Reference<unknown>;
  private keyFor: KeyFor<unknown>;

  constructor(ref: Reference<unknown>, keyFor: KeyFor<unknown>) {
    this.tag = ref.tag;
    this.ref = ref;
    this.keyFor = keyFor;
  }

  iterate(): OpaqueIterator {
    let { ref, keyFor } = this;

    let iterable = ref.value() as any;

    if (Array.isArray(iterable)) {
      return iterable.length > 0 ? new ArrayIterator(iterable, keyFor) : EMPTY_ITERATOR;
    } else if (iterable === undefined || iterable === null) {
      return EMPTY_ITERATOR;
    } else if (iterable.forEach !== undefined) {
      let array: any[] = [];
      iterable.forEach(function(item: any) {
        array.push(item);
      });
      return array.length > 0 ? new ArrayIterator(array, keyFor) : EMPTY_ITERATOR;
    } else if (typeof iterable === 'object') {
      let keys = Object.keys(iterable);
      return keys.length > 0
        ? new ObjectKeysIterator(keys, keys.map(key => iterable[key]), keyFor)
        : EMPTY_ITERATOR;
    } else {
      throw new Error(`Don't know how to {{#each ${iterable}}}`);
    }
  }

  valueReferenceFor(item: IterationItem<unknown, unknown>): UpdatableReference<unknown> {
    return new UpdatableReference(item.value);
  }

  updateValueReference(
    reference: UpdatableReference<unknown>,
    item: IterationItem<unknown, unknown>
  ) {
    reference.update(item.value);
  }

  memoReferenceFor(item: IterationItem<unknown, unknown>): UpdatableReference<unknown> {
    return new UpdatableReference(item.memo);
  }

  updateMemoReference(
    reference: UpdatableReference<unknown>,
    item: IterationItem<unknown, unknown>
  ) {
    reference.update(item.memo);
  }
}
