import { track, valueForTag, validateTag, consumeTag, Tag, Revision } from '@glimmer/validator';

export function trackedMemoize<T>(fn: () => T): () => T {
  let lastValue: T | undefined;
  let tag: Tag;
  let snapshot: Revision;

  return (): T => {
    if (!tag || !validateTag(tag, snapshot)) {
      tag = track(() => (lastValue = fn()));
      snapshot = valueForTag(tag);
    }

    consumeTag(tag);
    return lastValue!;
  };
}
