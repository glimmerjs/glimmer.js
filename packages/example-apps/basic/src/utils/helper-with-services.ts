import { CapturedArgs, helperCapabilities, HelperManager, setHelperManager } from '@glimmer/core';
import { Dict } from '@glimmer/interfaces';

type helperFunc<
  Positional extends unknown[] = unknown[],
  Named extends Dict<unknown> = Dict<unknown>,
  Services = unknown,
  Result = unknown
> = (positional: Positional, named: Named, services: Services) => Result;

interface HelperBucket<
  Positional extends unknown[] = unknown[],
  Named extends Dict<unknown> = Dict<unknown>,
  Owner = unknown,
  Result = unknown
> {
  fn: helperFunc<Positional, Named, Owner, Result>;
  args: CapturedArgs;
  services: unknown;
}

class HelperWithServicesManager implements HelperManager<HelperBucket> {
  capabilities = helperCapabilities('glimmerjs-2.0.0', {});

  constructor(private owner: { services: unknown }) {}

  createHelper(fn: helperFunc, args: CapturedArgs): HelperBucket {
    return { fn, args, services: this.owner.services };
  }

  getValue(instance: HelperBucket): unknown {
    const { args, services } = instance;
    return instance.fn(args.positional, args.named, services);
  }

  updateHelper(instance: HelperBucket, args: CapturedArgs): void {
    instance.args = args;
  }
}

const HelperWithServicesManagerFactory = (owner: {
  services: unknown;
}): HelperWithServicesManager => new HelperWithServicesManager(owner);

export function helper<T extends Function>(fn: T): T {
  setHelperManager(HelperWithServicesManagerFactory, fn);
  return fn;
}
