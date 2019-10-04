import { assert } from '@glimmer/util';

export interface Capabilities {
  asyncLifecycleCallbacks: boolean;
  destructor: boolean;
  updateHook: boolean;
}

export type OptionalCapabilities = Partial<Capabilities>;

export type ManagerAPIVersion = '3.4' | '3.13';

export function capabilities(
  managerAPI: ManagerAPIVersion,
  options: OptionalCapabilities = {}
): Capabilities {
  assert(
    managerAPI === '3.4' || managerAPI === '3.13',
    'Invalid component manager compatibility specified'
  );

  let updateHook = managerAPI === '3.13' ? Boolean(options.updateHook) : true;

  return {
    asyncLifecycleCallbacks: Boolean(options.asyncLifecycleCallbacks),
    destructor: Boolean(options.destructor),
    updateHook,
  };
}
