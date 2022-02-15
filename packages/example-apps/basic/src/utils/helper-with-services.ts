import { helperCapabilities, HelperManager, setHelperManager } from '@glimmer/core';
import { Dict, Arguments } from '@glimmer/interfaces';

type helperFunc<
  Positional extends readonly unknown[] = readonly unknown[],
  Named extends Dict<unknown> = Dict<unknown>,
  Services = unknown,
  Result = unknown
> = (positional: Positional, named: Named, services: Services) => Result;

interface HelperBucket<
  Positional extends readonly unknown[] = readonly unknown[],
  Named extends Dict<unknown> = Dict<unknown>,
  Owner = unknown,
  Result = unknown
> {
  fn: helperFunc<Positional, Named, Owner, Result>;
  args: Arguments;
  services: unknown;
}

class HelperWithServicesManager implements HelperManager<HelperBucket> {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
  });

  constructor(private owner: { services: unknown }) {}

  createHelper(fn: helperFunc, args: Arguments): HelperBucket {
    return { fn, args, services: this.owner.services };
  }

  getValue(instance: HelperBucket): unknown {
    const { args, services } = instance;
    return instance.fn(args.positional, args.named, services);
  }
}

const HelperWithServicesManagerFactory = (owner: {
  services: unknown;
}): HelperWithServicesManager => new HelperWithServicesManager(owner);

export function helper<T extends helperFunc>(fn: T): T {
  setHelperManager(HelperWithServicesManagerFactory, fn);
  return fn;
}
