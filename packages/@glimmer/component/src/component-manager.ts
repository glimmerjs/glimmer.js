import { componentCapabilities, CapturedArgs } from '@glimmer/core';

import BaseComponentManager, {
  Constructor,
} from '../addon/-private/base-component-manager';
import GlimmerComponent, { setDestroying, setDestroyed } from '../addon/-private/component';
import { setHostMeta } from '@glimmer/core';

const CAPABILITIES = componentCapabilities('3.13', {
  destructor: true,
});

/**
 * This component manager runs in Glimmer.js environments and extends the base component manager to:
 *
 * 1. Implement a lightweight destruction protocol (currently not deferred, like in Ember)
 * 2. Invoke legacy component lifecycle hooks (didInsertElement and didUpdate)
 */
export default class GlimmerComponentManager extends BaseComponentManager(
  () => null,
  () => null,
  CAPABILITIES
) {
  createComponent(
    ComponentClass: Constructor<GlimmerComponent>,
    args: CapturedArgs,
    hostMeta: unknown
  ): GlimmerComponent {
    const instance = super.createComponent(ComponentClass, args, hostMeta);

    setHostMeta(instance, hostMeta);

    return instance;
  }

  destroyComponent(component: GlimmerComponent): void {
    setDestroying(component);
    component.willDestroy();
    setDestroyed(component);
  }
}
