import {
  Reference,
  OpaqueIterator,
  OpaqueIterable,
  AbstractIterable,
  IterationItem,
} from '@glimmer/reference';
import { isDict } from '@glimmer/util';
import { Tag } from '@glimmer/validator';
import { UpdatableReference } from '../references';

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
    const { position, array, keyFor } = this;

    if (position >= array.length) return null;

    const value = array[position];
    const key = keyFor(value, position);
    const memo = position;

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
    const { position, keys, values, keyFor } = this;

    if (position >= keys.length) return null;

    const value = values[position];
    const memo = keys[position];
    const key = keyFor(value, memo);

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
    const { ref, keyFor } = this;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iterable = ref.value() as any;

    if (Array.isArray(iterable)) {
      return iterable.length > 0 ? new ArrayIterator(iterable, keyFor) : EMPTY_ITERATOR;
    } else if (iterable === undefined || iterable === null) {
      return EMPTY_ITERATOR;
    } else if (iterable.forEach !== undefined) {
      const array: unknown[] = [];
      iterable.forEach(function(item: unknown) {
        array.push(item);
      });
      return array.length > 0 ? new ArrayIterator(array, keyFor) : EMPTY_ITERATOR;
    } else if (typeof iterable === 'object') {
      const keys = Object.keys(iterable);
      return keys.length > 0
        ? new ObjectKeysIterator(
            keys,
            keys.map(key => iterable[key]),
            keyFor
          )
        : EMPTY_ITERATOR;
    }
    throw new Error(`Don't know how to {{#each ${iterable}}}`);
  }

  valueReferenceFor(item: IterationItem<unknown, unknown>): UpdatableReference<unknown> {
    return new UpdatableReference(item.value);
  }

  updateValueReference(
    reference: UpdatableReference<unknown>,
    item: IterationItem<unknown, unknown>
  ): void {
    reference.update(item.value);
  }

  memoReferenceFor(item: IterationItem<unknown, unknown>): UpdatableReference<unknown> {
    return new UpdatableReference(item.memo);
  }

  updateMemoReference(
    reference: UpdatableReference<unknown>,
    item: IterationItem<unknown, unknown>
  ): void {
    reference.update(item.memo);
  }
}

// TODO: Use built-in Glimmer VM iterables
export function iterableFor(ref: Reference<unknown>, keyPath: string): OpaqueIterable {
  let keyFor: KeyFor<unknown>;

  if (!keyPath) {
    throw new Error('Must specify a key for #each');
  }
  if (keyPath === '@identity') {
    throw new Error(
      '@identity key in #each loop supported only in Ember, use @primitive, @index or property path instead'
    );
  }

  switch (keyPath) {
    case '@index':
      keyFor = (_, index: unknown): string => String(index);
      break;
    case '@primitive':
      keyFor = (item: unknown): string => String(item);
      break;
    default:
      if (keyPath.charAt(0) === '@') {
        throw new Error(`Invalid key: ${keyPath}, valid keys: @index, @primitive, path`);
      }
      keyFor = (item: unknown): unknown => (isDict(item) ? item[keyPath] : item);
      break;
  }

  return new Iterable(ref, keyFor);
}
