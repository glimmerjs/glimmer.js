declare interface TrackedObject {
  fromEntries<T = unknown>(entries: Iterable<readonly [PropertyKey, T]>): { [k in PropertyKey]: T }

  new<T = {}>(obj?: T): T;
}

declare const TrackedObject: TrackedObject;

export default TrackedObject;
