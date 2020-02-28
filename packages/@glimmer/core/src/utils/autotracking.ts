import { track, value, validate, consume, Tag, Revision } from '@glimmer/validator';

export function trackedMemoize<T>(fn: () => T): () => T {
  let lastValue: T | undefined;
  let tag: Tag;
  let snapshot: Revision;

  return (): T => {
    if (!tag || !validate(tag, snapshot)) {
      tag = track(() => (lastValue = fn()));
      snapshot = value(tag);
    }

    consume(tag);
    return lastValue!;
  }
}
