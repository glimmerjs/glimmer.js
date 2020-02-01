import { capabilities } from '@glimmer/core';
import { SHOULD_SET_SCOPE } from '@glimmer/core/src/managers/component/custom';

import BaseComponentManager from '../addon/-private/base-component-manager';
import GlimmerComponent, { setDestroying, setDestroyed } from '../addon/-private/component';

const CAPABILITIES = capabilities('3.13', {
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
  [SHOULD_SET_SCOPE] = true;

  destroyComponent(component: GlimmerComponent) {
    setDestroying(component);
    component.willDestroy();
    setDestroyed(component);
  }
}
