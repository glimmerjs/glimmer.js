import * as gc from '@glimmer/component';
import { DESTROYED, DESTROYING } from '@glimmer/component/dist/types/addon/-private/component';

import { hasExactKeys } from './utils';

const Component = gc.default;

hasExactKeys<{
  default: unknown,
  setPropertyDidChange: unknown,
  tracked: unknown,
}>()(gc);

// $ExpectType typeof Component
gc.default;

// $ExpectType () => void
gc.setPropertyDidChange;

// $ExpectType () => void
gc.tracked;

type Args = {
  foo: number;
};

let component = new Component<Args>({}, { foo: 123 });

hasExactKeys<{
  args: unknown,
  bounds: {
    firstNode: unknown,
    lastNode: unknown,
  },
  debugName: unknown,
  didInsertElement: unknown,
  didUpdate: unknown,
  element: unknown,
  isDestroying: unknown,
  isDestroyed: unknown,
  willDestroy: unknown,

  // These are not public API, but technically exist as keys on the class, so
  // we have to include them to type check correctly. These can be removed or
  // changed without a major version bump.
  [DESTROYED]: unknown,
  [DESTROYING]: unknown,
}>()(component);

// $ExpectType Args
component.args;

// $ExpectType Bounds
component.bounds;

// $ExpectType string
component.debugName;

// $ExpectType () => void
component.didInsertElement;

// $ExpectType () => void
component.didUpdate;

// $ExpectType HTMLElement
component.element;

// $ExpectType boolean
component.isDestroying;

// $ExpectType boolean
component.isDestroyed;

// $ExpectType () => void
component.willDestroy;

// $ExpectError
component.args.bar = 123;
