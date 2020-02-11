import * as gc from '@glimmer/component';
import { hasExactKeys } from './utils';

const Component = gc.default;

hasExactKeys<{
  default: unknown;
}>()(gc);

// $ExpectType typeof GlimmerComponent
gc.default;

type Args = {
  foo: number;
};

const component = new Component<Args>({}, { foo: 123 });

hasExactKeys<{
  args: unknown;
  isDestroying: unknown;
  isDestroyed: unknown;
  willDestroy: unknown;
}>()(component);

// $ExpectType Readonly<Args>
component.args;

// $ExpectType boolean
component.isDestroying;

// $ExpectType boolean
component.isDestroyed;

// $ExpectType () => void
component.willDestroy;

// $ExpectError
component.args.bar = 123;
