import { DEBUG } from '@glimmer/env';
import { assert } from '@glimmer/util';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function fn(fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
  if (DEBUG) {
    assert(typeof fn === 'function', 'fn must receive a function as its first parameter');
    assert(
      args.length > 0,
      'fn must receive at least one argument to pass to the function, otherwise there is no need to use fn.'
    );
  }
  return fn.bind(null, ...args);
}
