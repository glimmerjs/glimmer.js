import {
  CapturedArgs,
  helperCapabilities,
  HelperManager,
  setHelperManager,
  setOwner,
} from '@glimmer/core';
import { Dict } from '@glimmer/interfaces';

interface Helper<
  Positional extends unknown[] = unknown[],
  Named extends Dict<unknown> = Dict<unknown>,
  Result = unknown
> {
  args?: Partial<CapturedArgs<Positional, Named>>;

  value?: Result;

  setup?(): void;
  update?(): void;
  teardown?(): void;
}

interface HelperConstructor {
  new (): Helper;
}

class CustomHelperManager implements HelperManager<Helper> {
  capabilities = helperCapabilities('glimmerjs-2.0.0', {
    destructor: true,
    updateHook: true,
  });

  constructor(private owner: unknown) {}

  createHelper(definition: HelperConstructor, args: CapturedArgs): Helper {
    const instance = new definition();
    instance.args = args;
    setOwner(instance, this.owner);
    instance.setup?.();
    return instance;
  }

  getValue(instance: Helper): unknown {
    return instance.value;
  }

  updateHelper(instance: Helper, args: CapturedArgs): void {
    instance.args = args;
    instance.update?.();
  }

  destroyHelper(instance: Helper): void {
    instance.teardown?.();
  }
}

const CustomHelperManagerFactory = (owner: unknown): CustomHelperManager => new CustomHelperManager(owner);

export function helper(Class: HelperConstructor): HelperConstructor {
  setHelperManager(CustomHelperManagerFactory, Class);
  return Class;
};
