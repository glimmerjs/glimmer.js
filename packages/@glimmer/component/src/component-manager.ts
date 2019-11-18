import { capabilities, Bounds } from '@glimmer/application';
import { setOwner, getOwner } from '@glimmer/di';

import BaseComponentManager from '../addon/-private/base-component-manager';
import { setDestroying, setDestroyed } from '../addon/-private/component';
import GlimmerComponent from './component';

const CAPABILITIES = capabilities('3.13', {
  asyncLifecycleCallbacks: true,
  updateHook: true,
  destructor: true,
});

/**
 * This component manager runs in Glimmer.js environments and extends the base component manager to:
 *
 * 1. Implement a lightweight destruction protocol (currently not deferred, like in Ember)
 * 2. Invoke legacy component lifecycle hooks (didInsertElement and didUpdate)
 */
export default class GlimmerComponentManager extends BaseComponentManager(
  setOwner,
  getOwner,
  CAPABILITIES
) {
  destroyComponent(component: GlimmerComponent) {
    setDestroying(component);
    component.willDestroy();
    setDestroyed(component);
  }

  didCreateComponent(component: GlimmerComponent) {
    component.didInsertElement();
  }

  updateComponent() { }

  didUpdateComponent(component: GlimmerComponent) {
    component.didUpdate();
  }

  __glimmer__didRenderLayout(component: GlimmerComponent, bounds: Bounds) {
    component.bounds = bounds;
  }
}
