import { DEBUG } from '@glimmer/env';

export let unbindableFunction: undefined | (<T, U>(func: (...args: T[]) => U) => ((...args: T[]) => U));

if (DEBUG) {
  unbindableFunction = <T, U>(func: (...args: T[]) => U): ((...args: T[]) => U) => {
    const assertOnProperty = (property: string | number | symbol): never => {
      throw new Error(
        `You accessed \`this.${String(
          property
        )}\` from a function passed to the ${func.name}, but the function itself was not bound to a valid \`this\` context. Consider updating to usage of \`@action\`.`
      );
    };

    const untouchableThis = new Proxy(
      {},
      {
        get(_target: {}, property: string | symbol): never {
          return assertOnProperty(property);
        },

        set(_target: {}, property: string | symbol): never {
          return assertOnProperty(property);
        },

        has(_target: {}, property: string | symbol): never {
          return assertOnProperty(property);
        },
      }
    );

    return func.bind(untouchableThis);
  }
}
