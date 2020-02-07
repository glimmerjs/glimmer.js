import * as gc from '@glimmer/component';
import { hasExactKeys } from './utils';

const Component = gc.default;

hasExactKeys<{
  default: unknown;
}>()(gc);

// $ExpectType typeof Component
gc.default;

type Args = {
  foo: number;
};

const component = new Component<Args>({}, { foo: 123 });

hasExactKeys<{
  args: unknown;
  bounds: {
    firstNode: unknown;
    lastNode: unknown;
  };
  debugName: unknown;
  didInsertElement: unknown;
  didUpdate: unknown;
  element: unknown;
  isDestroying: unknown;
  isDestroyed: unknown;
  willDestroy: unknown;
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
