import { CapturedArguments } from '@glimmer/interfaces';
import { consume } from '@glimmer/validator';
import { assert } from '@glimmer/util';
import { DEBUG } from '@glimmer/env';
import { Args } from '../interfaces';

function convertToInt(prop: number | string | symbol): number | null {
  if (typeof prop === 'symbol') return null;

  const num = Number(prop);

  if (isNaN(num)) return null;

  return num % 1 === 0 ? num : null;
}

export function argsProxyFor(
  capturedArgs: CapturedArguments,
  type: 'component' | 'helper' | 'modifier'
): Args {
  const { named, positional } = capturedArgs;

  const namedHandler: ProxyHandler<{}> = {
    get(_target, prop) {
      if (named.has(prop as string)) {
        const ref = named.get(prop as string);
        consume(ref.tag);

        return ref.value();
      }
    },

    has(_target, prop) {
      return named.has(prop as string);
    },

    ownKeys(_target) {
      return named.names;
    },

    isExtensible() {
      return false;
    },

    getOwnPropertyDescriptor(_target, prop) {
      if (DEBUG) {
        assert(
          named.has(prop as string),
          'args proxies do not have real property descriptors, so you should never need to call getOwnPropertyDescriptor yourself. This code exists for enumerability, such as in for-in loops and Object.keys()'
        );
      }
      return {
        enumerable: true,
        configurable: true,
      };
    },
  };

  const positionalHandler: ProxyHandler<[]> = {
    get(target, prop) {
      if (prop === 'length') {
        consume(positional.tag);
        return positional.length;
      }

      const parsed = convertToInt(prop);

      if (parsed !== null && parsed < positional.length) {
        const ref = positional.at(parsed);
        consume(ref.tag);

        return ref.value();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (target as any)[prop];
    },

    isExtensible() {
      return false;
    },

    has(_target, prop) {
      const parsed = convertToInt(prop);

      return parsed !== null && parsed < positional.length;
    },
  };

  const namedTarget = Object.create(null);
  const positionalTarget: unknown[] = [];

  if (DEBUG) {
    const setHandler = function(_target: unknown, prop: symbol | string | number): never {
      throw new Error(
        `You attempted to set ${String(
          prop
        )} on the arguments of a component, helper, or modifier. Arguments are immutable and cannot be updated directly, they always represent the values that is passed down. If you want to set default values, you should use a getter and local tracked state instead.`
      );
    };

    const forInDebugHandler = (): never => {
      throw new Error(
        `Object.keys() was called on the positional arguments array for a ${type}, which is not supported. This function is a low-level function that should not need to be called for positional argument arrays. You may be attempting to iterate over the array using for...in instead of for...of.`
      );
    };

    namedHandler.set = setHandler;
    positionalHandler.set = setHandler;
    positionalHandler.ownKeys = forInDebugHandler;
  }

  return {
    named: new Proxy(namedTarget, namedHandler),
    positional: new Proxy(positionalTarget, positionalHandler),
  };
}
