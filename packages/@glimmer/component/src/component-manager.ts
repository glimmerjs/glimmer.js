import { componentCapabilities } from '@glimmer/core';

import BaseComponentManager from '../addon/-private/base-component-manager';
import GlimmerComponent, { setDestroying, setDestroyed } from '../addon/-private/component';

const CAPABILITIES = componentCapabilities('3.13', {
  destructor: true,
});

/**
 * This component manager runs in Glimmer.js environments and extends the base component manager to:
 *
 * 1. Implement a lightweight destruction protocol (currently not deferred, like in Ember)
 * 2. Invoke legacy component lifecycle hooks (didInsertElement and didUpdate)
 */
export default class GlimmerComponentManager extends BaseComponentManager<GlimmerComponent> {
  capabilities = CAPABILITIES;

  destroyComponent(component: GlimmerComponent): void {
    setDestroying(component);
    component.willDestroy();
    setDestroyed(component);
  }
}
