import {
  TemplateArgs,
  helperCapabilities,
  HelperManager,
  setHelperManager,
  setOwner,
} from '@glimmer/core';
import { Dict } from '@glimmer/interfaces';
import { registerDestructor } from '@glimmer/runtime';

interface Helper<
  Positional extends unknown[] = unknown[],
  Named extends Dict<unknown> = Dict<unknown>,
  Result = unknown
> {
  args?: Partial<TemplateArgs<Positional, Named>>;

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
    destroyable: true,
    updateHook: true,
  });

  constructor(private owner: unknown) {}

  createHelper(definition: HelperConstructor, args: TemplateArgs): Helper {
    const instance = new definition();
    instance.args = args;
    setOwner(instance, this.owner);
    instance.setup?.();

    if (instance.teardown) {
      registerDestructor(instance, () => instance.teardown!());
    }

    return instance;
  }

  getValue(instance: Helper): unknown {
    return instance.value;
  }

  updateHelper(instance: Helper, args: TemplateArgs): void {
    instance.args = args;
    instance.update?.();
  }

  getDestroyable(instance: Helper): object {
    return instance;
  }
}

const CustomHelperManagerFactory = (owner: unknown): CustomHelperManager =>
  new CustomHelperManager(owner);

export function helper(Class: HelperConstructor): HelperConstructor {
  setHelperManager(CustomHelperManagerFactory, Class);
  return Class;
}
